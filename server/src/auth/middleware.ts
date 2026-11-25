import type { MiddlewareHandler } from "hono";

import { getDb } from "../db/client.js";
import { AppError } from "../util/errors.js";
import { verifyToken, type VibecareTokenClaims } from "./jwt.js";

/** Shape of `c.var.user` after `requireUser` runs. */
export interface AuthVariables {
  user: { userId: string; jti: string };
}

/**
 * Extracts and verifies the Bearer token, checks the session row is not
 * revoked, and stores `{userId, jti}` in the Hono context under `var.user`.
 *
 * Routes that need an authenticated user should `app.use("/api/foo", requireUser)`.
 */
export const requireUser: MiddlewareHandler<{ Variables: AuthVariables }> = async (
  c,
  next,
) => {
  // EventSource cannot set custom headers; accept the bearer via query param
  // as a fallback. The Authorization header still takes precedence.
  const header = c.req.header("authorization");
  const queryToken = c.req.query("_t");
  const bearer = header && header.toLowerCase().startsWith("bearer ")
    ? header.slice("bearer ".length).trim()
    : (queryToken ?? "");
  if (!bearer) {
    throw AppError.unauthorized("Missing bearer token");
  }
  const token = bearer;
  let claims: VibecareTokenClaims;
  try {
    claims = await verifyToken(token);
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }

  const db = getDb();
  const row = db
    .prepare("SELECT revoked, expires_at FROM sessions WHERE token = ?")
    .get(claims.jti) as { revoked: number; expires_at: string } | undefined;

  if (!row) throw AppError.unauthorized("Session not found");
  if (row.revoked) throw AppError.unauthorized("Session has been revoked");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw AppError.unauthorized("Session has expired");
  }

  c.set("user", { userId: claims.sub, jti: claims.jti });
  await next();
};

/**
 * Throw 403 if the caller's userId does not match the row's owner.
 * Used in every route that reads or mutates a single user-scoped row.
 */
export function assertOwner(rowUserId: string, callerUserId: string): void {
  if (rowUserId !== callerUserId) {
    throw AppError.forbidden("You do not have access to this resource");
  }
}