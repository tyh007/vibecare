import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/index.js";
import { makeTestDb } from "./_helpers.js";
import { resetRateLimits } from "../src/util/rateLimit.js";

describe("rate limiting", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    resetRateLimits();
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("blocks AI routes after the burst is consumed", async () => {
    // sign up a user to authenticate
    const signup = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "rl@example.com", password: "password123" }),
    });
    const { token } = (await signup.json()) as { token: string };

    // The auth limiter also allows 5 burst — use them up first.
    // We need to get a token without consuming the AI burst, but signup and
    // login are gated by /auth/* limiter (5 burst). Use a fresh user, then
    // exhaust the AI bucket (20 burst).
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };
    let lastStatus = 0;
    for (let i = 0; i < 30; i += 1) {
      const res = await app.request("/api/ai/partner", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: "hello",
          partnerName: "Mochi",
          partnerType: "cat",
        }),
      });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });

  it("does not rate-limit health (no auth required)", async () => {
    for (let i = 0; i < 30; i += 1) {
      const res = await app.request("/api/health");
      expect(res.status).toBe(200);
    }
  });
});