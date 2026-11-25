import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import type { Database as Db } from "better-sqlite3";

import { setDb } from "../src/db/client.js";
import { seedIfEmpty } from "../src/db/seed.js";
import { resetRateLimits } from "../src/util/rateLimit.js";

// Prevent the auto-bind in src/index.ts when it's transitively imported.
process.env.VIBECARE_TESTING = "1";

// JWT signing needs AUTH_SECRET; tests use a fixed value so tokens are
// deterministic across runs (within a process — re-issue per test if needed).
process.env.AUTH_SECRET ??= "test-secret-32-bytes-of-random-data-padding";
process.env.AI_KEY_PASSPHRASE ??= "test-passphrase-32-bytes-of-random-data-padding";

/**
 * Test harness: create a fresh in-memory SQLite DB, apply schema + seed,
 * install it as the singleton, and return a handle so tests can close it
 * afterwards. Used by every server test file.
 *
 * Also clears the in-memory rate-limit buckets so earlier tests in the same
 * process don't poison later ones.
 */
export function makeTestDb(): { db: Db; close: () => void } {
  resetRateLimits();
  const db = new Database(":memory:");
  db.pragma("journal_mode = MEMORY");
  db.pragma("foreign_keys = ON");

  const schemaPath = fileURLToPath(new URL("../src/db/schema.sql", import.meta.url));
  db.exec(readFileSync(schemaPath, "utf8"));
  seedIfEmpty(db);

  setDb(db);
  return { db, close: () => { setDb(null); db.close(); } };
}