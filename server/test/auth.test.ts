import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/index.js";
import { makeTestDb } from "./_helpers.js";

interface SignupResponse {
  token: string;
  user: { id: string; email: string; display_name: string };
}

async function signup(app: ReturnType<typeof createApp>, email: string, password = "password123"): Promise<SignupResponse> {
  const res = await app.request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, display_name: email.split("@")[0]! }),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as SignupResponse;
}

describe("auth routes", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("signup creates users + profiles + sessions and returns a token", async () => {
    const r = await signup(app, "alice@example.com");
    expect(r.token.split(".")).toHaveLength(3);
    expect(r.user.email).toBe("alice@example.com");

    const profile = await app.request("/api/profile", {
      headers: { authorization: `Bearer ${r.token}` },
    });
    expect(profile.status).toBe(200);
    const body = (await profile.json()) as { user_id: string; coins: number; display_name: string };
    expect(body.user_id).toBe(r.user.id);
    expect(body.coins).toBe(50);
    expect(body.display_name).toBe("alice");
  });

  it("login with wrong password returns 401", async () => {
    await signup(app, "bob@example.com");
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com", password: "wrong-pw" }),
    });
    expect(res.status).toBe(401);
  });

  it("logout revokes the token, blocking subsequent requests", async () => {
    const r = await signup(app, "carol@example.com");

    const logout = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${r.token}` },
    });
    expect(logout.status).toBe(204);

    const profile = await app.request("/api/profile", {
      headers: { authorization: `Bearer ${r.token}` },
    });
    expect(profile.status).toBe(401);
  });

  it("protected route rejects missing token", async () => {
    const res = await app.request("/api/profile");
    expect(res.status).toBe(401);
  });

  it("duplicate signup returns 409", async () => {
    await signup(app, "dup@example.com");
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "dup@example.com", password: "password123" }),
    });
    expect(res.status).toBe(409);
  });

  it("signup with invalid email returns 400", async () => {
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "password123" }),
    });
    expect(res.status).toBe(400);
  });

  it("session returns the current user when token is valid", async () => {
    const r = await signup(app, "dave@example.com");
    const res = await app.request("/api/auth/session", {
      headers: { authorization: `Bearer ${r.token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string } | null };
    expect(body.user?.email).toBe("dave@example.com");
  });
});