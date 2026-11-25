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

describe("community routes", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("posts a message and returns it with moderation metadata", async () => {
    const a = await makeAccount(app, "comm@example.com");
    const res = await app.request("/api/community/messages", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ content: "Hello, world!" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      message: { content: string; flagged: number };
      moderation: { flagged: boolean; moderationUnavailable?: boolean };
    };
    expect(body.message.content).toBe("Hello, world!");
    expect(body.message.flagged).toBe(0);
    expect(body.moderation.flagged).toBe(false);
  });

  it("flags a message containing crisis language and persists severity", async () => {
    const a = await makeAccount(app, "crisis@example.com");
    const res = await app.request("/api/community/messages", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ content: "I want to kill myself" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      message: { flagged: number; flag_severity: string | null };
      moderation: { flagged: boolean; severity: string | null; requiresIntervention: boolean };
    };
    expect(body.message.flagged).toBe(1);
    expect(body.message.flag_severity).toBe("critical");
    expect(body.moderation.severity).toBe("critical");
    expect(body.moderation.requiresIntervention).toBe(true);
  });

  it("user A cannot edit user B's message", async () => {
    const a = await makeAccount(app, "comm-a@example.com");
    const b = await makeAccount(app, "comm-b@example.com");
    const post = await app.request("/api/community/messages", {
      method: "POST",
      headers: authHeaders(b.token),
      body: JSON.stringify({ content: "owned by B" }),
    });
    const { message } = (await post.json()) as { message: { id: string } };
    const patch = await app.request(`/api/community/messages/${message.id}`, {
      method: "PATCH",
      headers: authHeaders(a.token),
      body: JSON.stringify({ content: "hijacked" }),
    });
    expect(patch.status).toBe(403);
  });

  it("SSE stream delivers a `hello` event followed by a `message` event after a post", async () => {
    const a = await makeAccount(app, "sse@example.com");
    const stream = await app.request("/api/community/stream", {
      headers: { authorization: `Bearer ${a.token}` },
    });
    expect(stream.status).toBe(200);
    expect(stream.headers.get("content-type")).toMatch(/text\/event-stream/);
    if (!stream.body) throw new Error("expected a body");

    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // First, read the initial hello frame.
    const first = await reader.read();
    buffer += decoder.decode(first.value ?? new Uint8Array());
    expect(buffer).toContain("event: hello");

    // Now post a message; expect a follow-up `message` event on the stream.
    await app.request("/api/community/messages", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ content: "broadcast me" }),
    });

    const second = await reader.read();
    buffer += decoder.decode(second.value ?? new Uint8Array());
    expect(buffer).toContain("event: message");
    expect(buffer).toContain("broadcast me");

    await reader.cancel();
  });
});