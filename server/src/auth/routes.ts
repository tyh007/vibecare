import { randomUUID } from "node:crypto";

import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { hashPassword, verifyPassword } from "./password.js";
import { issueToken } from "./jwt.js";
import { AppError } from "../util/errors.js";
import { rateLimit } from "../util/rateLimit.js";
import { logger } from "../util/logger.js";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  display_name: z.string().trim().min(1).max(64).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export interface PublicUser {
  id: string;
  email: string;
  display_name: string;
}

export function authRoutes(): Hono {
  const app = new Hono();

  // 5 attempts per IP per 60s for signup/login — slows brute force without
  // inconveniencing normal users.
  const authLimiter = rateLimit({
    scope: "auth",
    capacity: 5,
    refillPerSec: 5 / 60,
  });
  app.use("/auth/signup", authLimiter);
  app.use("/auth/login", authLimiter);

  app.post("/auth/signup", async (c) => {
    const body = signupSchema.parse(await c.req.json().catch(() => ({})));
    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(body.email.toLowerCase());
    if (existing) throw AppError.conflict("An account with that email already exists");

    const userId = randomUUID();
    const passwordHash = await hashPassword(body.password);
    const displayName = body.display_name?.trim() || body.email.split("@")[0]!;

    const { token, jti, expiresAt } = await issueToken({ userId });

    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO users (id, email, password_hash, display_name)
         VALUES (?, ?, ?, ?)`,
      ).run(userId, body.email.toLowerCase(), passwordHash, displayName);
      db.prepare(
        `INSERT INTO profiles (user_id, display_name)
         VALUES (?, ?)`,
      ).run(userId, displayName);
      db.prepare(
        `INSERT INTO sessions (token, user_id, expires_at)
         VALUES (?, ?, ?)`,
      ).run(jti, userId, expiresAt);
    });
    tx();

    return c.json(
      {
        token,
        user: { id: userId, email: body.email.toLowerCase(), display_name: displayName },
      },
      201,
    );
  });

  app.post("/auth/login", async (c) => {
    const body = loginSchema.parse(await c.req.json().catch(() => ({})));
    const db = getDb();

    const row = db
      .prepare(
        "SELECT id, password_hash, display_name FROM users WHERE email = ?",
      )
      .get(body.email.toLowerCase()) as
      | { id: string; password_hash: string; display_name: string }
      | undefined;
    if (!row) {
      logger.warn("auth.login.miss", { email: body.email.toLowerCase() });
      throw AppError.unauthorized("Invalid email or password");
    }

    const ok = await verifyPassword(body.password, row.password_hash);
    if (!ok) {
      logger.warn("auth.login.bad_password", { user_id: row.id });
      throw AppError.unauthorized("Invalid email or password");
    }

    const { token, jti, expiresAt } = await issueToken({ userId: row.id });
    db.prepare(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES (?, ?, ?)`,
    ).run(jti, row.id, expiresAt);

    return c.json({
      token,
      user: { id: row.id, email: body.email.toLowerCase(), display_name: row.display_name },
    });
  });

  app.post("/auth/logout", async (c) => {
    const header = c.req.header("authorization");
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      // Logout is idempotent: a missing token still returns 204.
      return c.body(null, 204);
    }
    const token = header.slice("bearer ".length).trim();
    // Find the session for this token by re-verifying the JWT.
    try {
      const { verifyToken } = await import("./jwt.js");
      const claims = await verifyToken(token);
      const db = getDb();
      db.prepare("UPDATE sessions SET revoked = 1 WHERE token = ?").run(claims.jti);
    } catch {
      // Token already invalid; nothing to revoke. Still return 204.
    }
    return c.body(null, 204);
  });

  app.get("/auth/session", async (c) => {
    // Lightweight self-check: re-uses requireUser semantics inline.
    const header = c.req.header("authorization");
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      return c.json({ user: null }, 200);
    }
    const token = header.slice("bearer ".length).trim();
    const { verifyToken } = await import("./jwt.js");
    let claims;
    try {
      claims = await verifyToken(token);
    } catch {
      return c.json({ user: null }, 200);
    }
    const db = getDb();
    const row = db
      .prepare("SELECT revoked, expires_at FROM sessions WHERE token = ?")
      .get(claims.jti) as { revoked: number; expires_at: string } | undefined;
    if (!row || row.revoked || new Date(row.expires_at).getTime() < Date.now()) {
      return c.json({ user: null }, 200);
    }
    const user = db
      .prepare("SELECT id, email, display_name FROM users WHERE id = ?")
      .get(claims.sub) as
      | { id: string; email: string; display_name: string }
      | undefined;
    if (!user) return c.json({ user: null }, 200);
    return c.json({
      user: { id: user.id, email: user.email, display_name: user.display_name },
    });
  });

  return app;
}