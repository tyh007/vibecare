import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";

import { logger } from "./logger.js";

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, "bad_request", message, details);
  }
  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(401, "unauthorized", message);
  }
  static forbidden(message = "Forbidden"): AppError {
    return new AppError(403, "forbidden", message);
  }
  static notFound(message = "Not found"): AppError {
    return new AppError(404, "not_found", message);
  }
  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, "conflict", message, details);
  }
  static internal(message = "Internal server error"): AppError {
    return new AppError(500, "internal", message);
  }
}

/**
 * Mount an error handler on a Hono app so any thrown AppError becomes a
 * JSON `{error:{code,message,details?}}` response with the right status.
 * ZodError becomes a 400 with the validation issues as `details`.
 * Anything else becomes 500 with a generic message and a server-side log.
 */
export function mountErrorHandler(app: Hono): void {
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        err.status as ContentfulStatusCode,
      );
    }
    if (err instanceof ZodError) {
      return c.json(
        {
          error: {
            code: "bad_request",
            message: "Invalid request body",
            details: err.issues,
          },
        },
        400 as ContentfulStatusCode,
      );
    }
    logger.error("unhandled_error", { err: err instanceof Error ? err.message : String(err) });
    return c.json(
      { error: { code: "internal", message: "Internal server error" } },
      500 as ContentfulStatusCode,
    );
  });

  app.notFound((c) =>
    c.json({ error: { code: "not_found", message: "Route not found" } }, 404),
  );
}