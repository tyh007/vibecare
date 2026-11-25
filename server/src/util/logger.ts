/**
 * Minimal structured logger. Avoids pulling in pino to keep the runtime image
 * small and dependency-light. Each log line is a single JSON object — easy to
 * pipe into log aggregators later without code changes.
 */

const LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_RANK: Record<Level, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

let _level: Level = (process.env.LOG_LEVEL as Level) ?? "info";
if (!LEVELS.includes(_level)) _level = "info";

function emit(level: Level, message: string, fields?: Record<string, unknown>): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[_level]) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  };
  // stderr for warn/error, stdout otherwise — matches most log-aggregator expectations.
  const stream = level === "warn" || level === "error" ? process.stderr : process.stdout;
  stream.write(JSON.stringify(line) + "\n");
}

export const logger = {
  trace: (msg: string, fields?: Record<string, unknown>) => emit("trace", msg, fields),
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};