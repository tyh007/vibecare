import { request } from "./http.js";

export interface VibecareShopItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  icon: string;
}

export const shopService = {
  list(): Promise<VibecareShopItem[]> {
    return request<VibecareShopItem[]>("/shop/items");
  },
};