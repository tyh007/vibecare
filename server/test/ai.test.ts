import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/index.js";
import { makeTestDb } from "./_helpers.js";

async function makeAccount(app: ReturnType<typeof createApp>, email: string): Promise<string> {
  const res = await app.request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const body = (await res.json()) as { token: string };
  return body.token;
}

function authHeaders(t: string): Record<string, string> {
  return { authorization: `Bearer ${t}`, "content-type": "application/json" };
}

describe("AI template routes", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("partner route returns a normal response with no professional-help nudge", async () => {
    const token = await makeAccount(app, "ai-normal@example.com");
    const res = await app.request("/api/ai/partner", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        message: "I had a really good day today.",
        partnerName: "Mochi",
        partnerType: "cat",
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { response: string; suggestProfessionalHelp: boolean };
    expect(body.suggestProfessionalHelp).toBe(false);
    expect(body.response.length).toBeGreaterThan(0);
  });

  it("partner route returns suggestProfessionalHelp:true on crisis language", async () => {
    const token = await makeAccount(app, "ai-crisis@example.com");
    const res = await app.request("/api/ai/partner", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        message: "I want to kill myself",
        partnerName: "Mochi",
        partnerType: "panda",
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { response: string; suggestProfessionalHelp: boolean };
    expect(body.suggestProfessionalHelp).toBe(true);
    expect(body.response).toMatch(/988|crisis|emergency/i);
  });

  it("cbt route picks a template based on keyword", async () => {
    const token = await makeAccount(app, "cbt@example.com");
    const res = await app.request("/api/ai/cbt", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        message: "I always fail at everything.",
        conversationHistory: [],
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { response: string };
    expect(body.response.length).toBeGreaterThan(0);
  });

  it("moderate route returns critical severity for suicidal content", async () => {
    const token = await makeAccount(app, "mod@example.com");
    const res = await app.request("/api/ai/moderate", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ message: "I want to end it all tonight" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      flagged: boolean;
      severity: string | null;
      requiresIntervention: boolean;
    };
    expect(body.flagged).toBe(true);
    expect(body.severity).toBe("critical");
    expect(body.requiresIntervention).toBe(true);
  });

  it("moderate route returns safe for ordinary text", async () => {
    const token = await makeAccount(app, "mod-ok@example.com");
    const res = await app.request("/api/ai/moderate", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ message: "Just wanted to share a positive update." }),
    });
    const body = (await res.json()) as { flagged: boolean; moderationUnavailable?: boolean };
    expect(body.flagged).toBe(false);
    expect(body.moderationUnavailable).toBeFalsy();
  });
});