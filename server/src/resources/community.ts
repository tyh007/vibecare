import { randomUUID } from "node:crypto";

import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { assertOwner, requireUser, type AuthVariables } from "../auth/middleware.js";
import { selectAdapter } from "../ai/adapter.js";
import { getHub } from "../realtime/hub.js";
import { sseStream } from "../realtime/sse.js";
import { AppError } from "../util/errors.js";

const createSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

interface MessageRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  flagged: number;
  flag_reason: string | null;
  flag_severity: string | null;
}

interface ModerationPayload {
  flagged: boolean;
  severity: string | null;
  reason: string | null;
  requiresIntervention: boolean;
  moderationUnavailable?: boolean;
}

const TOPIC = "community";

export function communityRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get("/community/stream", requireUser, (c) => {
    return sseStream(c, TOPIC);
  });

  app.get("/community/messages", requireUser, (c) => {
    const limitRaw = c.req.query("limit");
    const limit = limitRaw ? Math.min(500, Math.max(1, Number(limitRaw))) : 100;

    const rows = getDb()
      .prepare(
        `SELECT m.id, m.user_id, m.content, m.created_at, m.flagged, m.flag_reason, m.flag_severity,
                p.display_name
         FROM community_messages m
         LEFT JOIN profiles p ON p.user_id = m.user_id
         ORDER BY m.created_at DESC
         LIMIT ?`,
      )
      .all(limit) as Array<MessageRow & { display_name: string | null }>;

    return c.json(rows);
  });

  app.post("/community/messages", requireUser, async (c) => {
    const { userId } = c.get("user");
    const body = createSchema.parse(await c.req.json().catch(() => ({})));

    const id = randomUUID();
    const db = getDb();
    db.prepare(
      `INSERT INTO community_messages (id, user_id, content)
       VALUES (?, ?, ?)`,
    ).run(id, userId, body.content);

    // Run moderation synchronously. If the AI call fails the adapter's
    // contract returns { flagged: false, moderationUnavailable: true }, so we
    // never block the message but signal degraded service to the caller.
    const adapter = selectAdapter(userId);
    let moderation: ModerationPayload;
    try {
      moderation = (await adapter.moderate({
        message: body.content,
        userId,
      })) as ModerationPayload;
    } catch (err) {
      console.error("[community] moderation threw unexpectedly", err);
      moderation = {
        flagged: false,
        severity: null,
        reason: "Moderation service unavailable",
        requiresIntervention: false,
        moderationUnavailable: true,
      };
    }

    if (moderation.flagged) {
      db.prepare(
        `UPDATE community_messages
         SET flagged = 1, flag_reason = ?, flag_severity = ?
         WHERE id = ?`,
      ).run(moderation.reason, moderation.severity, id);
    }

    const row = db
      .prepare(
        `SELECT m.id, m.user_id, m.content, m.created_at, m.flagged, m.flag_reason, m.flag_severity,
                p.display_name
         FROM community_messages m
         LEFT JOIN profiles p ON p.user_id = m.user_id
         WHERE m.id = ?`,
      )
      .get(id) as MessageRow & { display_name: string | null };

    getHub().publish(TOPIC, {
      event: "message",
      data: { op: "create", message: row },
    });

    return c.json({ message: row, moderation }, 201);
  });

  app.patch("/community/messages/:id", requireUser, async (c) => {
    const { userId } = c.get("user");
    const id = c.req.param("id");
    const body = z
      .object({ content: z.string().trim().min(1).max(4000) })
      .parse(await c.req.json().catch(() => ({})));

    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM community_messages WHERE id = ?")
      .get(id) as { user_id: string } | undefined;
    if (!existing) throw AppError.notFound("Message not found");
    assertOwner(existing.user_id, userId);

    db.prepare("UPDATE community_messages SET content = ? WHERE id = ?").run(
      body.content,
      id,
    );
    const row = db
      .prepare(
        `SELECT m.id, m.user_id, m.content, m.created_at, m.flagged, m.flag_reason, m.flag_severity,
                p.display_name
         FROM community_messages m
         LEFT JOIN profiles p ON p.user_id = m.user_id
         WHERE m.id = ?`,
      )
      .get(id) as MessageRow & { display_name: string | null };

    getHub().publish(TOPIC, {
      event: "message",
      data: { op: "update", message: row },
    });

    return c.json(row);
  });

  app.delete("/community/messages/:id", requireUser, (c) => {
    const { userId } = c.get("user");
    const id = c.req.param("id");
    const db = getDb();
    const existing = db
      .prepare("SELECT user_id FROM community_messages WHERE id = ?")
      .get(id) as { user_id: string } | undefined;
    if (!existing) throw AppError.notFound("Message not found");
    assertOwner(existing.user_id, userId);
    db.prepare("DELETE FROM community_messages WHERE id = ?").run(id);
    getHub().publish(TOPIC, { event: "message", data: { op: "delete", id } });
    return c.body(null, 204);
  });

  return app;
}