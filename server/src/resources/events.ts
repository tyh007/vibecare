import { randomUUID } from "node:crypto";

import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { assertOwner, requireUser, type AuthVariables } from "../auth/middleware.js";
import { AppError } from "../util/errors.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createSchema = z.object({
  title: z.string().min(1).max(120),
  start_iso: z.string().min(1).max(64),
  end_iso: z.string().min(1).max(64),
  date: isoDate,
  category: z.string().min(1).max(64),
  notes: z.string().max(2000).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
});

const patchSchema = createSchema.partial();

interface EventRow {
  id: string;
  user_id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  date: string;
  category: string;
  notes: string | null;
  color: string | null;
  created_at: string;
}

export function eventRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  app.get("/events", (c) => {
    const { userId } = c.get("user");
    const from = c.req.query("from");
    const to = c.req.query("to");

    let rows: EventRow[];
    const db = getDb();
    if (from && to) {
      rows = db
        .prepare(
          "SELECT * FROM calendar_events WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date, start_iso",
        )
        .all(userId, from, to) as EventRow[];
    } else {
      rows = db
        .prepare(
          "SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date, start_iso",
        )
        .all(userId) as EventRow[];
    }
    return c.json(rows);
  });

  app.post("/events", async (c) => {
    const { userId } = c.get("user");
    const body = createSchema.parse(await c.req.json().catch(() => ({})));
    const id = randomUUID();
    getDb()
      .prepare(
        `INSERT INTO calendar_events
         (id, user_id, title, start_iso, end_iso, date, category, notes, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        userId,
        body.title,
        body.start_iso,
        body.end_iso,
        body.date,
        body.category,
        body.notes ?? null,
        body.color ?? null,
      );
    const row = getDb()
      .prepare("SELECT * FROM calendar_events WHERE id = ?")
      .get(id) as EventRow;
    return c.json(row, 201);
  });

  app.patch("/events/:id", async (c) => {
    const { userId } = c.get("user");
    const id = c.req.param("id");
    const body = patchSchema.parse(await c.req.json().catch(() => ({})));

    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM calendar_events WHERE id = ?")
      .get(id) as { user_id: string } | undefined;
    if (!existing) throw AppError.notFound("Event not found");
    assertOwner(existing.user_id, userId);

    const updates: string[] = [];
    const params: unknown[] = [];
    for (const key of [
      "title",
      "start_iso",
      "end_iso",
      "date",
      "category",
      "notes",
      "color",
    ] as const) {
      const v = body[key];
      if (v !== undefined) {
        updates.push(`${key} = ?`);
        params.push(v);
      }
    }
    if (updates.length === 0) {
      const row = db
        .prepare("SELECT * FROM calendar_events WHERE id = ?")
        .get(id) as EventRow;
      return c.json(row);
    }
    params.push(id);
    db.prepare(`UPDATE calendar_events SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    const row = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(id) as EventRow;
    return c.json(row);
  });

  app.delete("/events/:id", (c) => {
    const { userId } = c.get("user");
    const id = c.req.param("id");
    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM calendar_events WHERE id = ?")
      .get(id) as { user_id: string } | undefined;
    if (!existing) throw AppError.notFound("Event not found");
    assertOwner(existing.user_id, userId);
    db.prepare("DELETE FROM calendar_events WHERE id = ?").run(id);
    return c.body(null, 204);
  });

  return app;
}