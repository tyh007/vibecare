import "dotenv/config";

import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { aiRoutes } from "./resources/ai.js";
import { authRoutes } from "./auth/routes.js";
import { communityRoutes } from "./resources/community.js";
import { getDb } from "./db/client.js";
import { eventRoutes } from "./resources/events.js";
import { healthRoute } from "./resources/health.js";
import { inventoryRoutes } from "./resources/inventory.js";
import { moodRoutes } from "./resources/moods.js";
import { noteRoutes } from "./resources/notes.js";
import { profileRoutes } from "./resources/profile.js";
import { settingsRoutes } from "./resources/settings.js";
import { shopRoutes } from "./resources/shop.js";
import { mountErrorHandler } from "./util/errors.js";
import { logger } from "./util/logger.js";

/**
 * Boot order:
 *   1. Read required env (PORT, AUTH_SECRET, AI_KEY_PASSPHRASE).
 *   2. Make sure the SQLite parent dir exists.
 *   3. Open the DB (this also applies schema.sql and seeds shop items).
 *   4. Compose the Hono app with all route modules under /api.
 *   5. Start the Node HTTP server.
 *
 * The exported `createApp` returns the Hono app without binding it, which the
 * test suite uses with `app.request(...)` instead of listening on a port.
 */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    console.error(`[server] required env var ${name} is missing`);
    process.exit(1);
  }
  return v;
}

/** Close the singleton SQLite handle (flushing WAL) and shut the HTTP
 *  server down cleanly. Wired up to SIGINT/SIGTERM below. */
function shutdown(server: { close: (cb?: (err?: Error) => void) => void }): void {
  logger.info("shutdown.start");
  server.close((err) => {
    if (err) logger.error("shutdown.http_close_failed", { err: err.message });
    try {
      getDb().close();
    } catch (closeErr) {
      logger.error("shutdown.db_close_failed", {
        err: closeErr instanceof Error ? closeErr.message : String(closeErr),
      });
    }
    logger.info("shutdown.done");
    process.exit(err ? 1 : 0);
  });
  // Hard timeout so a stuck connection can't hold us forever.
  setTimeout(() => {
    logger.warn("shutdown.forced");
    process.exit(1);
  }, 10_000).unref();
}

export function createApp(): Hono {
  // Trigger DB init early so any schema problems fail at startup, not at first
  // request. Tests pass an explicit DB_PATH.
  const dbPath = process.env.DB_PATH ?? join(process.cwd(), "server", "data", "vibecare.db");
  const parent = dirname(dbPath);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  getDb(dbPath);

  const app = new Hono();
  mountErrorHandler(app);

  app.route("/api", healthRoute());
  app.route("/api", authRoutes());
  app.route("/api", profileRoutes());
  app.route("/api", moodRoutes());
  app.route("/api", eventRoutes());
  app.route("/api", noteRoutes());
  app.route("/api", communityRoutes());
  app.route("/api", aiRoutes());
  app.route("/api", shopRoutes());
  app.route("/api", inventoryRoutes());
  app.route("/api", settingsRoutes());

  // In production, serve the built Vite client from the same origin so SSE
  // and fetch share a single port. Static-client path is configurable via
  // STATIC_DIR; default points at the Vite `dist/` produced by `pnpm build`.
  const staticDir = process.env.STATIC_DIR ?? resolve(process.cwd(), "dist");
  if (existsSync(staticDir) && statSync(staticDir).isDirectory()) {
    app.use(
      "/*",
      serveStatic({
        root: staticDir,
        rewriteRequestPath: (path) => (path === "/" ? "/index.html" : path),
      }),
    );
    // SPA fallback: any non-/api GET that didn't resolve to a file lands on
    // index.html so client-side routes work.
    app.get("*", serveStatic({ path: join(staticDir, "index.html") }));
  }

  return app;
}

// Auto-bind only when run directly (not when imported by tests or tooling).
// tsx sets process.argv[1] to the .ts path; the import.meta.url path may differ
// in encoding (e.g. %20 vs space) so an exact URL compare is unreliable. Use a
// explicit env flag instead: tests set VIBECARE_TESTING=1 to opt out.
if (!process.env.VIBECARE_TESTING) {
  // Defensive: only auto-bind when this file is the program entrypoint. ESM
  // may execute this module during import-time hoisting even if we are not
  // the actual entry — gating on env var handles the common case, but
  // skipping when running under vitest's worker is also wise.
  const isVitest = !!process.env.VITEST;
  if (!isVitest) {
    requireEnv("AUTH_SECRET");
    requireEnv("AI_KEY_PASSPHRASE");
    const port = Number(process.env.PORT ?? 8787);
    const hostname = process.env.HOST ?? "127.0.0.1";
    const app = createApp();
    const server = serve(
      { fetch: app.fetch, port, hostname },
      (info) => {
        logger.info("listening", { hostname, port: info.port });
      },
    );
    process.on("SIGINT", () => shutdown(server));
    process.on("SIGTERM", () => shutdown(server));
  }
}
