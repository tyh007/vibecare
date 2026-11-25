import { request } from "./http.js";
import type { VibecareShopItem } from "./shop.js";

export interface VibecareInventoryEntry extends VibecareShopItem {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
}

const VALID_FIELDS = new Set([
  "hairstyle",
  "hair_color",
  "eye_color",
  "top",
  "bottom",
  "accessory",
]);

export const inventoryService = {
  list(): Promise<VibecareInventoryEntry[]> {
    return request<VibecareInventoryEntry[]>("/inventory");
  },
  purchase(item_id: string): Promise<{ ok: true; coins_spent: number }> {
    return request<{ ok: true; coins_spent: number }>("/inventory/purchase", {
      method: "POST",
      body: { item_id },
    });
  },
  equip(field: string, item_id: string): Promise<{ ok: true }> {
    if (!VALID_FIELDS.has(field)) {
      return Promise.reject(new Error(`Invalid avatar field: ${field}`));
    }
    return request<{ ok: true }>("/inventory/equip", {
      method: "POST",
      body: { field, item_id },
    });
  },
};