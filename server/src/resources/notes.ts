import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { assertOwner, requireUser, type AuthVariables } from "../auth/middleware.js";
import { AppError } from "../util/errors.js";

const putSchema = z.object({
  event_id: z.string().uuid(),
  notes: z.string().max(2000).default(""),
});

export function noteRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  app.get("/notes", (c) => {
    const { userId } = c.get("user");
    const eventId = c.req.query("eventId");
    if (!eventId) throw AppError.badRequest("eventId is required");
    const row = getDb()
      .prepare("SELECT * FROM event_notes WHERE event_id = ?")
      .get(eventId) as
      | { event_id: string; user_id: string; notes: string; updated_at: string }
      | undefined;
    if (!row) return c.json({ event_id: eventId, notes: "", updated_at: null });
    assertOwner(row.user_id, userId);
    return c.json(row);
  });

  app.put("/notes/:eventId", async (c) => {
    const { userId } = c.get("user");
    const eventId = c.req.param("eventId");
    const body = putSchema.parse({ ...(await c.req.json().catch(() => ({}))), event_id: eventId });

    const db = getDb();
    const event = db
      .prepare("SELECT user_id FROM calendar_events WHERE id = ?")
      .get(eventId) as { user_id: string } | undefined;
    if (!event) throw AppError.notFound("Event not found");
    assertOwner(event.user_id, userId);

    db.prepare(
      `INSERT INTO event_notes (event_id, user_id, notes, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(event_id) DO UPDATE SET
         notes = excluded.notes,
         updated_at = datetime('now')`,
    ).run(eventId, userId, body.notes);

    const row = db
      .prepare("SELECT * FROM event_notes WHERE event_id = ?")
      .get(eventId) as { event_id: string; user_id: string; notes: string; updated_at: string };
    return c.json(row);
  });

  return app;
}