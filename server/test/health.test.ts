import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../src/index.js";
import { makeTestDb } from "./_helpers.js";

describe("GET /api/health", () => {
  let close: () => void;

  afterEach(() => close?.());

  it("returns 200 with status, db, and AI provider", async () => {
    close = makeTestDb().close;
    const app = createApp();

    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; db: string; ai: string };
    expect(body).toEqual({ status: "ok", db: "ok", ai: "template" });
  });
});