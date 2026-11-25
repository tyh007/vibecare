import { randomUUID } from "node:crypto";

import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { assertOwner, requireUser, type AuthVariables } from "../auth/middleware.js";
import { AppError } from "../util/errors.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

const createSchema = z.object({
  mood: z.number().int().min(1).max(5),
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  physical_activity_minutes: z.number().int().min(0).max(60 * 24).nullable().optional(),
  screen_time_minutes: z.number().int().min(0).max(60 * 48).nullable().optional(),
  hydration_ml: z.number().int().min(0).max(20000).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

const patchSchema = createSchema.partial();

interface MoodRow {
  id: string;
  user_id: string;
  mood: number;
  sleep_hours: number | null;
  physical_activity_minutes: number | null;
  screen_time_minutes: number | null;
  hydration_ml: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export function moodRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  app.get("/moods", (c) => {
    const { userId } = c.get("user");
    const limitRaw = c.req.query("limit");
    const limit = limitRaw ? Math.min(500, Math.max(1, Number(limitRaw))) : 100;
    const rows = getDb()
      .prepare(
        "SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      )
      .all(userId, limit) as MoodRow[];
    return c.json(rows);
  });

  app.post("/moods", async (c) => {
    const { userId } = c.get("user");
    const body = createSchema.parse(await c.req.json().catch(() => ({})));

    const id = randomUUID();
    const db = getDb();
    db.transaction(() => {
      db.prepare(
        `INSERT INTO mood_entries
         (id, user_id, mood, sleep_hours, physical_activity_minutes,
          screen_time_minutes, hydration_ml, location, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        userId,
        body.mood,
        body.sleep_hours ?? null,
        body.physical_activity_minutes ?? null,
        body.screen_time_minutes ?? null,
        body.hydration_ml ?? null,
        body.location ?? null,
        body.notes ?? null,
      );
      updateStreakAndCoins(userId, body.mood);
    })();

    const row = db
      .prepare("SELECT * FROM mood_entries WHERE id = ?")
      .get(id) as MoodRow;
    return c.json(row, 201);
  });

  app.patch("/moods/:id", async (c) => {
    const { userId } = c.get("user");
    const id = c.req.param("id");
    const body = patchSchema.parse(await c.req.json().catch(() => ({})));

    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM mood_entries WHERE id = ?")
      .get(id) as { user_id: string } | undefined;
    if (!existing) throw AppError.notFound("Mood entry not found");
    assertOwner(existing.user_id, userId);

    const updates: string[] = [];
    const params: unknown[] = [];
    for (const key of [
      "mood",
      "sleep_hours",
      "physical_activity_minutes",
      "screen_time_minutes",
      "hydration_ml",
      "location",
      "notes",
    ] as const) {
      const v = body[key];
      if (v !== undefined) {
        updates.push(`${key} = ?`);
        params.push(v);
      }
    }
    if (updates.length === 0) {
      const row = db
        .prepare("SELECT * FROM mood_entries WHERE id = ?")
        .get(id) as MoodRow;
      return c.json(row);
    }
    params.push(id);
    db.prepare(`UPDATE mood_entries SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    const row = db.prepare("SELECT * FROM mood_entries WHERE id = ?").get(id) as MoodRow;
    return c.json(row);
  });

  app.delete("/moods/:id", (c) => {
    const { userId } = c.get("user");
    const id = c.req.param("id");
    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM mood_entries WHERE id = ?")
      .get(id) as { user_id: string } | undefined;
    if (!existing) throw AppError.notFound("Mood entry not found");
    assertOwner(existing.user_id, userId);
    db.prepare("DELETE FROM mood_entries WHERE id = ?").run(id);
    return c.body(null, 204);
  });

  return app;
}

/**
 * Same transaction as the mood insert: bump total check-ins, update the
 * current streak if this is the first entry of a new day, and award 10
 * coins per check-in.
 *
 * The previous Supabase trigger did this in SQL; here we do it in JS for
 * parity. Day boundary is the user's local day — since we don't have a TZ
 * column we use UTC date().closeEnough for a prototype.
 */
function updateStreakAndCoins(userId: string, _mood: number): void {
  const db = getDb();
  const profile = db
    .prepare(
      "SELECT coins, current_streak, longest_streak, total_check_ins, last_check_in FROM profiles WHERE user_id = ?",
    )
    .get(userId) as
    | {
        coins: number;
        current_streak: number;
        longest_streak: number;
        total_check_ins: number;
        last_check_in: string | null;
      }
    | undefined;
  if (!profile) return;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let nextStreak = profile.current_streak;
  if (profile.last_check_in === today) {
    /* same day, streak unchanged */
  } else if (profile.last_check_in === yesterday) {
    nextStreak = profile.current_streak + 1;
  } else {
    nextStreak = 1;
  }

  db.prepare(
    `UPDATE profiles
     SET coins = coins + 10,
         current_streak = ?,
         longest_streak = MAX(longest_streak, ?),
         total_check_ins = total_check_ins + 1,
         last_check_in = ?
     WHERE user_id = ?`,
  ).run(nextStreak, nextStreak, today, userId);
}