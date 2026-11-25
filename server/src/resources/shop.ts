import { Hono } from "hono";
import { z } from "zod";

import { getDb } from "../db/client.js";
import { AppError } from "../util/errors.js";

interface ShopItemRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  icon: string;
}

export function shopRoutes(): Hono {
  const app = new Hono();

  app.get("/shop/items", (c) => {
    const rows = getDb()
      .prepare("SELECT * FROM shop_items ORDER BY category, price")
      .all() as ShopItemRow[];
    return c.json(rows);
  });

  return app;
}