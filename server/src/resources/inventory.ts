import { randomUUID } from "node:crypto";

import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { requireUser, type AuthVariables } from "../auth/middleware.js";
import { AppError } from "../util/errors.js";

const purchaseSchema = z.object({
  item_id: z.string().min(1),
});

interface InventoryRow {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
}

interface ShopItemRow {
  id: string;
  name: string;
  category: string;
  price: number;
  icon: string;
}

const VALID_AVATAR_FIELDS = new Set([
  "hairstyle",
  "hair_color",
  "eye_color",
  "top",
  "bottom",
  "accessory",
]);

const equipSchema = z.object({
  field: z.string().min(1),
  item_id: z.string().min(1),
});

export function inventoryRoutes(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", requireUser);

  app.get("/inventory", (c) => {
    const { userId } = c.get("user");
    const rows = getDb()
      .prepare(
        `SELECT i.id, i.user_id, i.item_id, i.purchased_at,
                s.name, s.description, s.category, s.price, s.icon
         FROM user_inventory i
         JOIN shop_items s ON s.id = i.item_id
         WHERE i.user_id = ?
         ORDER BY i.purchased_at DESC`,
      )
      .all(userId) as Array<InventoryRow & ShopItemRow>;
    return c.json(rows);
  });

  app.post("/inventory/purchase", async (c) => {
    const { userId } = c.get("user");
    const body = purchaseSchema.parse(await c.req.json().catch(() => ({})));

    const db = getDb();
    const item = db
      .prepare("SELECT id, price FROM shop_items WHERE id = ?")
      .get(body.item_id) as { id: string; price: number } | undefined;
    if (!item) throw AppError.notFound("Item not found");

    // Atomic check: already owned, sufficient coins, insert.
    const owned = db
      .prepare("SELECT 1 AS x FROM user_inventory WHERE user_id = ? AND item_id = ?")
      .get(userId, body.item_id);
    if (owned) throw AppError.conflict("You already own this item");

    const profile = db
      .prepare("SELECT coins FROM profiles WHERE user_id = ?")
      .get(userId) as { coins: number } | undefined;
    if (!profile) throw AppError.notFound("Profile not found");
    if (profile.coins < item.price) {
      throw AppError.conflict("Not enough coins");
    }

    const invId = randomUUID();
    db.transaction(() => {
      db.prepare(
        "UPDATE profiles SET coins = coins - ? WHERE user_id = ?",
      ).run(item.price, userId);
      db.prepare(
        `INSERT INTO user_inventory (id, user_id, item_id)
         VALUES (?, ?, ?)`,
      ).run(invId, userId, body.item_id);
    })();

    return c.json({ ok: true, coins_spent: item.price });
  });

  app.post("/inventory/equip", async (c) => {
    const { userId } = c.get("user");
    const body = equipSchema.parse(await c.req.json().catch(() => ({})));

    if (!VALID_AVATAR_FIELDS.has(body.field)) {
      throw AppError.badRequest("Unknown avatar field");
    }

    const db = getDb();
    const owned = db
      .prepare("SELECT 1 AS x FROM user_inventory WHERE user_id = ? AND item_id = ?")
      .get(userId, body.item_id) as { x: number } | undefined;
    if (!owned) throw AppError.forbidden("You don't own that item");

    db.prepare(`UPDATE profiles SET ${body.field} = ? WHERE user_id = ?`).run(
      body.item_id,
      userId,
    );
    return c.json({ ok: true });
  });

  return app;
}