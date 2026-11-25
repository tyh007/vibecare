import { Hono } from "hono";

import { getDb } from "../db/client.js";
import { assertOwner, requireUser, type AuthVariables } from "../auth/middleware.js";
import { z } from "zod";
import { AppError } from "../util/errors.js";

export interface ProfileRow {
  user_id: string;
  display_name: string | null;
  onboarded_at: string | null;
  coins: number;
  last_check_in: string | null;
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  hairstyle: string;
  hair_color: string;
  eye_color: string;
  top: string;
  bottom: string;
  accessory: string;
  created_at: string;
}

const AVATAR_KEYS = ["hairstyle", "hair_color", "eye_color", "top", "bottom", "accessory"] as const;

const patchSchema = z.object({
  display_name: z.string().trim().min(1).max(64).optional(),
  hairstyle: z.string().min(1).max(64).optional(),
  hair_color: z.string().min(1).max(64).optional(),
  eye_color: z.string().min(1).max(64).optional(),
  top: z.string().min(1).max(64).optional(),
  bottom: z.string().min(1).max(64).optional(),
  accessory: z.string().min(1).max(64).optional(),
});

export function profileRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  app.get("/profile", (c) => {
    const { userId } = c.get("user");
    const row = getDb()
      .prepare("SELECT * FROM profiles WHERE user_id = ?")
      .get(userId) as ProfileRow | undefined;
    if (!row) throw AppError.notFound("Profile not found");
    return c.json(row);
  });

  app.patch("/profile", async (c) => {
    const { userId } = c.get("user");
    const body = patchSchema.parse(await c.req.json().catch(() => ({})));

    const updates: string[] = [];
    const params: unknown[] = [];

    for (const key of AVATAR_KEYS) {
      const v = body[key];
      if (typeof v === "string") {
        updates.push(`${key} = ?`);
        params.push(v);
      }
    }
    if (typeof body.display_name === "string") {
      updates.push("display_name = ?");
      params.push(body.display_name);
    }
    if (updates.length === 0) return c.json({ ok: true });

    params.push(userId);
    const db = getDb();
    db.prepare(`UPDATE profiles SET ${updates.join(", ")} WHERE user_id = ?`).run(...params);
    if (typeof body.display_name === "string") {
      db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(
        body.display_name,
        userId,
      );
    }
    return c.json({ ok: true });
  });

  app.get("/profile/:userId/public", (c) => {
    const caller = c.get("user");
    const targetUserId = c.req.param("userId");
    // Public profile is readable by any authenticated user, but only the
    // display_name + a few non-sensitive fields are exposed.
    const row = getDb()
      .prepare(
        "SELECT user_id, display_name FROM profiles WHERE user_id = ?",
      )
      .get(targetUserId) as { user_id: string; display_name: string | null } | undefined;
    if (!row) throw AppError.notFound("Profile not found");
    // Used to enforce caller is the requester for non-public lookups; kept for parity.
    void caller;
    return c.json(row);
  });

  app.post("/profile/onboard", async (c) => {
    const { userId } = c.get("user");
    const body = z
      .object({
        display_name: z.string().trim().min(1).max(64).optional(),
      })
      .parse(await c.req.json().catch(() => ({})));

    const db = getDb();
    const row = db
      .prepare("SELECT user_id FROM profiles WHERE user_id = ?")
      .get(userId) as { user_id: string } | undefined;
    if (!row) throw AppError.notFound("Profile not found");
    assertOwner(row.user_id, userId);

    if (body.display_name) {
      db.prepare(
        "UPDATE profiles SET display_name = ?, onboarded_at = datetime('now') WHERE user_id = ?",
      ).run(body.display_name, userId);
      db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(
        body.display_name,
        userId,
      );
    } else {
      db.prepare(
        "UPDATE profiles SET onboarded_at = datetime('now') WHERE user_id = ?",
      ).run(userId);
    }
    return c.json({ ok: true });
  });

  return app;
}