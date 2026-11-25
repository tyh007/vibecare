import type { MiddlewareHandler } from "hono";

import { AppError } from "./errors.js";

/**
 * Simple in-memory token-bucket rate limiter.
 *
 * Each (route, key) tuple gets its own bucket with `capacity` tokens, refilled
 * at `refillPerSec`. When a request arrives the bucket is debited by 1; if the
 * bucket is empty we 429 the caller. The map is bounded by `maxKeys` to avoid
 * unbounded memory growth from abusive callers.
 *
 * Suitable for the prototype — in production, swap for a Redis-backed bucket
 * so limits are consistent across replicas.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface RateLimitOptions {
  capacity: number;
  refillPerSec: number;
  /** Identify the bucket — usually the route prefix. */
  scope: string;
  /** Maximum distinct keys before we stop tracking new ones (oldest pruned). */
  maxKeys?: number;
  /** Custom key extractor. Defaults to the caller's userId (then IP). */
  keyFn?: (c: { get: (k: "user" | string) => unknown; req: { header: (h: string) => string | undefined } }) => string;
}

const GLOBAL_MAX_KEYS = 10_000;
const BUCKETS = new Map<string, Bucket>();

function takeKey(
  scope: string,
  c: { get: (k: string) => unknown; req: { header: (h: string) => string | undefined } },
  keyFn?: RateLimitOptions["keyFn"],
): string {
  if (keyFn) return `${scope}:${keyFn(c)}`;
  const user = c.get("user") as { userId?: string } | undefined;
  if (user?.userId) return `${scope}:user:${user.userId}`;
  const ip = c.req.header("x-forwarded-for") ?? "anon";
  return `${scope}:ip:${ip}`;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const key = takeKey(opts.scope, c, opts.keyFn);
    const now = Date.now();
    let bucket = BUCKETS.get(key);
    if (!bucket) {
      bucket = { tokens: opts.capacity, updatedAt: now };
      BUCKETS.set(key, bucket);
      if (BUCKETS.size > (opts.maxKeys ?? GLOBAL_MAX_KEYS)) {
        // Drop the oldest entry to keep memory bounded.
        const oldest = BUCKETS.keys().next().value;
        if (oldest) BUCKETS.delete(oldest);
      }
    } else {
      const elapsed = (now - bucket.updatedAt) / 1000;
      bucket.tokens = Math.min(
        opts.capacity,
        bucket.tokens + elapsed * opts.refillPerSec,
      );
      bucket.updatedAt = now;
    }

    if (bucket.tokens < 1) {
      const retry = Math.ceil((1 - bucket.tokens) / opts.refillPerSec);
      c.header("Retry-After", String(retry));
      throw new AppError(
        429,
        "rate_limited",
        `Too many requests. Try again in ${retry}s.`,
      );
    }
    bucket.tokens -= 1;
    await next();
  };
}

/** Test helper: reset all buckets. */
export function resetRateLimits(): void {
  BUCKETS.clear();
}