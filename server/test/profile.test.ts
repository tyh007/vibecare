import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/index.js";
import { makeTestDb } from "./_helpers.js";

interface Account {
  token: string;
  userId: string;
}

async function makeAccount(app: ReturnType<typeof createApp>, email: string): Promise<Account> {
  const res = await app.request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const body = (await res.json()) as { token: string; user: { id: string } };
  return { token: body.token, userId: body.user.id };
}

function authHeaders(t: string): Record<string, string> {
  return { authorization: `Bearer ${t}` };
}

describe("profile routes", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("GET /api/profile returns the signed-in user's profile", async () => {
    const a = await makeAccount(app, "eve@example.com");
    const res = await app.request("/api/profile", { headers: authHeaders(a.token) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user_id: string; coins: number; hairstyle: string };
    expect(body.user_id).toBe(a.userId);
    expect(body.coins).toBe(50);
    expect(body.hairstyle).toBe("long");
  });

  it("PATCH /api/profile updates avatar fields and display name", async () => {
    const a = await makeAccount(app, "frank@example.com");

    const patch = await app.request("/api/profile", {
      method: "PATCH",
      headers: { ...authHeaders(a.token), "content-type": "application/json" },
      body: JSON.stringify({ hairstyle: "short", hair_color: "pink", display_name: "Frankie" }),
    });
    expect(patch.status).toBe(200);

    const after = await app.request("/api/profile", { headers: authHeaders(a.token) });
    const row = (await after.json()) as { hairstyle: string; hair_color: string; display_name: string };
    expect(row.hairstyle).toBe("short");
    expect(row.hair_color).toBe("pink");
    expect(row.display_name).toBe("Frankie");
  });

  it("user A cannot read user B's profile via the public endpoint trick (only display_name is exposed)", async () => {
    const a = await makeAccount(app, "gina@example.com");
    const b = await makeAccount(app, "hugo@example.com");

    const res = await app.request(`/api/profile/${b.userId}/public`, { headers: authHeaders(a.token) });
    expect(res.status).toBe(200);
    const row = (await res.json()) as { user_id: string; display_name: string };
    expect(row.user_id).toBe(b.userId);
    // Sensitive fields should NOT be present:
    expect((row as unknown as { coins?: number }).coins).toBeUndefined();
  });

  it("POST /api/profile/onboard sets onboarded_at", async () => {
    const a = await makeAccount(app, "iris@example.com");
    const res = await app.request("/api/profile/onboard", {
      method: "POST",
      headers: { ...authHeaders(a.token), "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const after = await app.request("/api/profile", { headers: authHeaders(a.token) });
    const row = (await after.json()) as { onboarded_at: string | null };
    expect(row.onboarded_at).not.toBeNull();
  });
});