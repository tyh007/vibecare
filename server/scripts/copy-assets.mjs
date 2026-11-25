#!/usr/bin/env node
// Copy non-TS assets (schema.sql) into dist/ after `tsc` runs.
// Plain Node script — no deps so it works in any pnpm/Node 20+ env.

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const pairs = [
  ["src/db/schema.sql", "dist/db/schema.sql"],
];

for (const [from, to] of pairs) {
  const absFrom = resolve(root, from);
  const absTo = resolve(root, to);
  mkdirSync(dirname(absTo), { recursive: true });
  copyFileSync(absFrom, absTo);
  console.log(`[copy-assets] ${from} -> ${to}`);
}