import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database, { type Database as Db } from "better-sqlite3";
import { seedIfEmpty } from "./seed.js";

let _db: Db | null = null;

export function getDb(dbPath?: string): Db {
  if (_db) return _db;

  const path =
    dbPath ??
    process.env.DB_PATH ??
    join(process.cwd(), "server", "data", "vibecare.db");

  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  applySchema(db);
  seedIfEmpty(db);

  _db = db;
  return db;
}

/** Test helper: replace the singleton. */
export function setDb(db: Db | null): void {
  if (_db && _db !== db) _db.close();
  _db = db;
}

function applySchema(db: Db): void {
  const here = dirname(fileURLToPath(import.meta.url));
  let dir = here;
  for (let i = 0; i < 5; i += 1) {
    const candidate = join(dir, "schema.sql");
    try {
      const sql = readFileSync(candidate, "utf8");
      db.exec(sql);
      return;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error("schema.sql not found near server/src/db");
}