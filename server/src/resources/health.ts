import { Hono } from "hono";
import { getDb } from "../db/client.js";
import { selectAdapter } from "../ai/adapter.js";

/**
 * `GET /api/health` — used by the client to detect whether the API is reachable
 * and to display the AI provider currently in use (for diagnostic copy).
 */
export function healthRoute(): Hono {
  const app = new Hono();

  app.get("/health", (c) => {
    const db = getDb();
    let dbOk = false;
    try {
      const row = db.prepare("SELECT 1 AS ok").get() as { ok: number } | undefined;
      dbOk = row?.ok === 1;
    } catch {
      dbOk = false;
    }

    const ai = selectAdapter().name;
    const status = dbOk ? "ok" : "degraded";

    return c.json({ status, db: dbOk ? "ok" : "error", ai }, dbOk ? 200 : 503);
  });

  return app;
}