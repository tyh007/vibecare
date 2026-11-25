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

describe("shop + inventory routes", () => {
  let close: () => void;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    close = makeTestDb().close;
    app = createApp();
  });
  afterEach(() => close?.());

  it("lists the seeded shop catalogue", async () => {
    const a = await makeAccount(app, "shop@example.com");
    const res = await app.request("/api/shop/items", {
      headers: authHeaders(a.token),
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; category: string }>;
    expect(list.length).toBeGreaterThan(20);
    expect(list.map((i) => i.category)).toContain("hairstyle");
  });

  it("purchases an item, deducts coins, and prevents double-buying", async () => {
    const a = await makeAccount(app, "buyer@example.com");
    // Choose an affordable item (start freebies cost 0).
    const cheap = await app.request("/api/shop/items", {
      headers: authHeaders(a.token),
    });
    const list = (await cheap.json()) as Array<{ id: string; price: number }>;
    const target = list.find((i) => i.price === 30)!;
    expect(target).toBeTruthy();

    const purchase = await app.request("/api/inventory/purchase", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ item_id: target.id }),
    });
    expect(purchase.status).toBe(200);
    const result = (await purchase.json()) as { ok: true; coins_spent: number };
    expect(result.coins_spent).toBe(30);

    const profile = await app.request("/api/profile", {
      headers: { authorization: `Bearer ${a.token}` },
    });
    const row = (await profile.json()) as { coins: number };
    expect(row.coins).toBe(20);

    const second = await app.request("/api/inventory/purchase", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ item_id: target.id }),
    });
    expect(second.status).toBe(409);
  });

  it("rejects purchase when the user does not have enough coins", async () => {
    const a = await makeAccount(app, "poor@example.com");
    const list = (await (await app.request("/api/shop/items", {
      headers: authHeaders(a.token),
    })).json()) as Array<{ id: string; price: number }>;
    const pricey = list.find((i) => i.price >= 100)!;
    expect(pricey).toBeTruthy();

    const res = await app.request("/api/inventory/purchase", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ item_id: pricey.id }),
    });
    expect(res.status).toBe(409);
  });

  it("equips an item the user owns and updates the profile field", async () => {
    const a = await makeAccount(app, "equip@example.com");
    const list = (await (await app.request("/api/shop/items", {
      headers: authHeaders(a.token),
    })).json()) as Array<{ id: string; category: string; price: number }>;
    const item = list.find((i) => i.category === "hairstyle" && i.price === 30)!;
    expect(item).toBeTruthy();

    await app.request("/api/inventory/purchase", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ item_id: item.id }),
    });

    const equip = await app.request("/api/inventory/equip", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ field: "hairstyle", item_id: item.id }),
    });
    expect(equip.status).toBe(200);

    const profile = await app.request("/api/profile", {
      headers: { authorization: `Bearer ${a.token}` },
    });
    const row = (await profile.json()) as { hairstyle: string };
    expect(row.hairstyle).toBe(item.id);
  });

  it("refuses to equip an item the user does not own", async () => {
    const a = await makeAccount(app, "thief@example.com");
    const list = (await (await app.request("/api/shop/items", {
      headers: authHeaders(a.token),
    })).json()) as Array<{ id: string }>;
    const someItem = list[0]!;

    const res = await app.request("/api/inventory/equip", {
      method: "POST",
      headers: authHeaders(a.token),
      body: JSON.stringify({ field: "hairstyle", item_id: someItem.id }),
    });
    expect(res.status).toBe(403);
  });
});