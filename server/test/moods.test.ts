import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/index.js";
import { makeTestDb } from "./_helpers.js";

interface Account {
  token: string;
  userId: string;
}

async function makeAccount(
  app: ReturnType<typeof createApp>,
  email: string,
): Promise<Account> {
  const res = await app.request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const body = (await res.json()) as { token: string; user: { id: string } };
  return { token: body.token, userId: body.user.id };
}

function authHeaders(t: string): Record<string, string> {
  return { authorization: `Bearer ${t}`, "content-type": "application/json" };
}

describe("mood routes", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("rejects mood out of range", async () => {
    const a = await makeAccount(app, "mood@example.com");
    const res = await app.request("/api/moods", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ mood: 6 }),
    });
    expect(res.status).toBe(400);
  });

  it("creates a mood entry and awards coins/streak", async () => {
    const a = await makeAccount(app, "coins@example.com");
    const create = await app.request("/api/moods", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ mood: 4, notes: "decent day" }),
    });
    expect(create.status).toBe(201);
    const entry = (await create.json()) as { mood: number; notes: string };
    expect(entry.mood).toBe(4);

    const profile = await app.request("/api/profile", {
      headers: { authorization: `Bearer ${a.token}` },
    });
    const row = (await profile.json()) as {
      coins: number;
      current_streak: number;
      total_check_ins: number;
    };
    expect(row.coins).toBe(60); // 50 starting + 10 per entry
    expect(row.current_streak).toBe(1);
    expect(row.total_check_ins).toBe(1);
  });

  it("user A cannot read user B's moods", async () => {
    const a = await makeAccount(app, "alice@example.com");
    const b = await makeAccount(app, "bob@example.com");

    // Bob creates an entry.
    await app.request("/api/moods", {
      method: "POST",
      headers: authHeaders(b.token),
      body: JSON.stringify({ mood: 3 }),
    });

    // Alice listing her moods should see none.
    const res = await app.request("/api/moods", {
      headers: { authorization: `Bearer ${a.token}` },
    });
    const list = (await res.json()) as unknown[];
    expect(list).toHaveLength(0);
  });

  it("user A cannot patch user B's mood entry", async () => {
    const a = await makeAccount(app, "patch-a@example.com");
    const b = await makeAccount(app, "patch-b@example.com");

    const create = await app.request("/api/moods", {
      method: "POST",
      headers: authHeaders(b.token),
      body: JSON.stringify({ mood: 2 }),
    });
    const { id } = (await create.json()) as { id: string };

    const patch = await app.request(`/api/moods/${id}`, {
      method: "PATCH",
      headers: authHeaders(a.token),
      body: JSON.stringify({ notes: "hijacked" }),
    });
    expect(patch.status).toBe(403);
  });

  it("deletes an entry the caller owns", async () => {
    const a = await makeAccount(app, "del@example.com");
    const create = await app.request("/api/moods", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ mood: 1 }),
    });
    const { id } = (await create.json()) as { id: string };

    const del = await app.request(`/api/moods/${id}`, {
      method: "DELETE",
      headers: authHeaders(a.token),
    });
    expect(del.status).toBe(204);
  });
});