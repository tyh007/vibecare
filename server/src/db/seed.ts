import type { Database as Db } from "better-sqlite3";

/**
 * Seed default shop items on first boot. Idempotent: if `shop_items` already
 * has rows, this is a no-op. Mirrors the catalogue inserted by the previous
 * Supabase migration (`supabase/migrations/20251019171013_*.sql`).
 */
export function seedIfEmpty(db: Db): void {
  const row = db.prepare("SELECT COUNT(*) AS n FROM shop_items").get() as { n: number };
  if (row.n > 0) return;

  const insert = db.prepare(`
    INSERT INTO shop_items (id, name, description, category, price, icon)
    VALUES (@id, @name, @description, @category, @price, @icon)
  `);

  const tx = db.transaction((items: ShopItemSeed[]) => {
    for (const item of items) insert.run(item);
  });

  tx(DEFAULT_SHOP_ITEMS);
}

interface ShopItemSeed {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  icon: string;
}

const DEFAULT_SHOP_ITEMS: ShopItemSeed[] = [
  // Hairstyles
  { id: "hairstyle_long", name: "Long Hair", description: "Flowing long locks", category: "hairstyle", price: 0, icon: "💇‍♀️" },
  { id: "hairstyle_short", name: "Short Cut", description: "Crisp short hair", category: "hairstyle", price: 30, icon: "✂️" },
  { id: "hairstyle_curly", name: "Curly Bob", description: "Bouncy curls", category: "hairstyle", price: 60, icon: "👩‍🦱" },
  { id: "hairstyle_braids", name: "Box Braids", description: "Protective box braids", category: "hairstyle", price: 120, icon: "👱🏾‍♀️" },
  { id: "hairstyle_ponytail", name: "Ponytail", description: "Practical ponytail", category: "hairstyle", price: 20, icon: "🏇" },

  // Hair colors
  { id: "hair_brown", name: "Brown", description: "Natural brown", category: "hair_color", price: 0, icon: "🟫" },
  { id: "hair_black", name: "Black", description: "Deep black", category: "hair_color", price: 10, icon: "⬛" },
  { id: "hair_blonde", name: "Blonde", description: "Sun-kissed blonde", category: "hair_color", price: 40, icon: "🟨" },
  { id: "hair_red", name: "Auburn", description: "Warm auburn", category: "hair_color", price: 40, icon: "🟧" },
  { id: "hair_pink", name: "Rose", description: "Playful rose", category: "hair_color", price: 80, icon: "🌸" },
  { id: "hair_blue", name: "Indigo", description: "Bold indigo", category: "hair_color", price: 80, icon: "🟦" },
  { id: "hair_silver", name: "Silver", description: "Cool silver", category: "hair_color", price: 100, icon: "⚪" },

  // Eye colors
  { id: "eyes_brown", name: "Brown Eyes", description: "Warm brown eyes", category: "eye_color", price: 0, icon: "🤎" },
  { id: "eyes_blue", name: "Blue Eyes", description: "Bright blue eyes", category: "eye_color", price: 30, icon: "💙" },
  { id: "eyes_green", name: "Green Eyes", description: "Forest green eyes", category: "eye_color", price: 30, icon: "💚" },
  { id: "eyes_hazel", name: "Hazel Eyes", description: "Hazel eyes", category: "eye_color", price: 50, icon: "🤎" },
  { id: "eyes_amber", name: "Amber Eyes", description: "Glowing amber eyes", category: "eye_color", price: 60, icon: "🟠" },

  // Tops
  { id: "top_basic", name: "Basic Tee", description: "Everyday tee", category: "top", price: 0, icon: "👕" },
  { id: "top_hoodie", name: "Cozy Hoodie", description: "Warm hoodie", category: "top", price: 50, icon: "🧥" },
  { id: "top_blazer", name: "Smart Blazer", description: "Crisp blazer", category: "top", price: 120, icon: "🤵" },
  { id: "top_sweater", name: "Knit Sweater", description: "Wool knit", category: "top", price: 70, icon: "🧶" },
  { id: "top_rainbow", name: "Rainbow Tee", description: "Bright rainbow", category: "top", price: 90, icon: "🌈" },
  { id: "top_jacket", name: "Denim Jacket", description: "Classic denim", category: "top", price: 100, icon: "🧥" },

  // Bottoms
  { id: "bottom_basic", name: "Basic Pants", description: "Everyday pants", category: "bottom", price: 0, icon: "👖" },
  { id: "bottom_jeans", name: "Blue Jeans", description: "Classic blue jeans", category: "bottom", price: 40, icon: "👖" },
  { id: "bottom_skirt", name: "Pleated Skirt", description: "Pleated skirt", category: "bottom", price: 60, icon: "👗" },
  { id: "bottom_shorts", name: "Casual Shorts", description: "Summer shorts", category: "bottom", price: 30, icon: "🩳" },
  { id: "bottom_dress", name: "Summer Dress", description: "Light summer dress", category: "bottom", price: 110, icon: "👗" },

  // Accessories
  { id: "acc_none", name: "None", description: "No accessory", category: "accessory", price: 0, icon: "❌" },
  { id: "acc_glasses", name: "Glasses", description: "Reading glasses", category: "accessory", price: 25, icon: "👓" },
  { id: "acc_sunglasses", name: "Sunglasses", description: "Cool sunglasses", category: "accessory", price: 35, icon: "🕶️" },
  { id: "acc_earrings", name: "Earrings", description: "Drop earrings", category: "accessory", price: 30, icon: "💎" },
  { id: "acc_hat", name: "Beanie", description: "Warm beanie", category: "accessory", price: 30, icon: "🧢" },
  { id: "acc_scarf", name: "Scarf", description: "Cozy scarf", category: "accessory", price: 40, icon: "🧣" },
  { id: "acc_backpack", name: "Backpack", description: "Study backpack", category: "accessory", price: 60, icon: "🎒" },
  { id: "acc_flower", name: "Flower Pin", description: "Cheerful pin", category: "accessory", price: 25, icon: "🌺" },
  { id: "acc_watch", name: "Watch", description: "Classic watch", category: "accessory", price: 90, icon: "⌚" },
  { id: "acc_plant", name: "Potted Plant", description: "Friendly plant", category: "accessory", price: 70, icon: "🪴" },
  { id: "acc_book", name: "Book", description: "Well-loved book", category: "accessory", price: 50, icon: "📚" },
  { id: "acc_cat", name: "Tiny Cat", description: "Pocket-sized friend", category: "accessory", price: 150, icon: "🐱" },
  { id: "acc_dog", name: "Tiny Dog", description: "Loyal companion", category: "accessory", price: 150, icon: "🐶" },
  { id: "acc_fox", name: "Tiny Fox", description: "Curious fox", category: "accessory", price: 180, icon: "🦊" },
  { id: "acc_butterfly", name: "Butterfly", description: "Gentle butterfly", category: "accessory", price: 100, icon: "🦋" },
  { id: "acc_star", name: "Star Pin", description: "Shining star", category: "accessory", price: 80, icon: "⭐" },
  { id: "acc_moon", name: "Moon Pin", description: "Quiet moon", category: "accessory", price: 80, icon: "🌙" },
  { id: "acc_heart", name: "Heart Pin", description: "Caring heart", category: "accessory", price: 60, icon: "💗" },
  { id: "acc_mug", name: "Tea Mug", description: "Warm mug", category: "accessory", price: 55, icon: "☕" },
  { id: "acc_pen", name: "Fountain Pen", description: "Reliable pen", category: "accessory", price: 60, icon: "🖋️" },
  { id: "acc_laptop", name: "Laptop", description: "Work laptop", category: "accessory", price: 200, icon: "💻" },
  { id: "acc_headphones", name: "Headphones", description: "Quiet headphones", category: "accessory", price: 110, icon: "🎧" },
];