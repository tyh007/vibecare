import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { requireUser, type AuthVariables } from "../auth/middleware.js";
import { AppError } from "../util/errors.js";
import { encrypt } from "../auth/secrets.js";

const patchSchema = z.object({
  ai_provider: z.enum(["template", "remote"]).optional(),
  ai_model: z.string().min(1).max(120).optional(),
  crisis_sensitivity: z.enum(["low", "medium", "high"]).optional(),
});

const onboardingSchema = z.object({
  payload: z.unknown().optional(),
  support: z.unknown().optional(),
});

const aiKeySchema = z.object({
  api_key: z.string().min(1).max(4000),
});

interface SettingsRow {
  user_id: string;
  ai_provider: "template" | "remote";
  ai_model: string;
  crisis_sensitivity: "low" | "medium" | "high";
  has_key: number;
  updated_at: string;
}

export function settingsRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  app.get("/settings", (c) => {
    const { userId } = c.get("user");
    const db = getDb();
    let row = db
      .prepare("SELECT * FROM settings WHERE user_id = ?")
      .get(userId) as SettingsRow | undefined;
    if (!row) {
      db.prepare(
        `INSERT INTO settings (user_id) VALUES (?)`,
      ).run(userId);
      row = db
        .prepare("SELECT * FROM settings WHERE user_id = ?")
        .get(userId) as SettingsRow;
    }
    return c.json({
      ai_provider: row.ai_provider,
      ai_model: row.ai_model,
      crisis_sensitivity: row.crisis_sensitivity,
      has_key: row.has_key === 1,
    });
  });

  app.put("/settings", async (c) => {
    const { userId } = c.get("user");
    const body = patchSchema.parse(await c.req.json().catch(() => ({})));

    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM settings WHERE user_id = ?")
      .get(userId);
    if (!existing) {
      db.prepare("INSERT INTO settings (user_id) VALUES (?)").run(userId);
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.ai_provider) {
      updates.push("ai_provider = ?");
      params.push(body.ai_provider);
    }
    if (body.ai_model) {
      updates.push("ai_model = ?");
      params.push(body.ai_model);
    }
    if (body.crisis_sensitivity) {
      updates.push("crisis_sensitivity = ?");
      params.push(body.crisis_sensitivity);
    }
    if (updates.length === 0) return c.json({ ok: true });

    updates.push("updated_at = datetime('now')");
    params.push(userId);
    db.prepare(
      `UPDATE settings SET ${updates.join(", ")} WHERE user_id = ?`,
    ).run(...params);

    return c.json({ ok: true });
  });

  app.put("/settings/ai-key", async (c) => {
    const { userId } = c.get("user");
    const body = aiKeySchema.parse(await c.req.json().catch(() => ({})));

    const env = encrypt(body.api_key);
    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM settings WHERE user_id = ?")
      .get(userId);
    if (!existing) {
      db.prepare("INSERT INTO settings (user_id) VALUES (?)").run(userId);
    }
    db.prepare(
      `UPDATE settings
       SET ai_key_ciphertext = ?, ai_key_iv = ?, ai_key_tag = ?,
           has_key = 1, updated_at = datetime('now')
       WHERE user_id = ?`,
    ).run(env.ciphertext, env.iv, env.tag, userId);
    return c.json({ ok: true });
  });

  app.delete("/settings/ai-key", (c) => {
    const { userId } = c.get("user");
    const db = getDb();
    db.prepare(
      `UPDATE settings
       SET ai_key_ciphertext = NULL, ai_key_iv = NULL, ai_key_tag = NULL,
           has_key = 0, updated_at = datetime('now')
       WHERE user_id = ?`,
    ).run(userId);
    return c.json({ ok: true });
  });

  app.post("/onboarding", async (c) => {
    const { userId } = c.get("user");
    const body = onboardingSchema.parse(await c.req.json().catch(() => ({})));
    if (body.payload !== undefined && typeof body.payload !== "string") {
      throw AppError.badRequest("payload must be a JSON string");
    }
    if (body.support !== undefined && typeof body.support !== "string") {
      throw AppError.badRequest("support must be a JSON string");
    }
    const db = getDb();
    db.prepare(
      `UPDATE profiles
       SET onboarded_at = COALESCE(onboarded_at, datetime('now'))
       WHERE user_id = ?`,
    ).run(userId);

    // Persist onboarding payload + support contact into settings. We store as
    // JSON text so the schema doesn't need to know the shape.
    const existing = db
      .prepare("SELECT user_id FROM settings WHERE user_id = ?")
      .get(userId);
    if (!existing) {
      db.prepare("INSERT INTO settings (user_id) VALUES (?)").run(userId);
    }
    db.prepare(
      `UPDATE settings
       SET onboarding_payload = COALESCE(?, onboarding_payload),
           onboarding_support = COALESCE(?, onboarding_support),
           updated_at = datetime('now')
       WHERE user_id = ?`,
    ).run(
      body.payload ?? null,
      body.support ?? null,
      userId,
    );
    return c.json({ ok: true });
  });

  return app;
}