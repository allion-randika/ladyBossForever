import type { Category } from "./types";

// Curated real stock photography (Unsplash — free for commercial use, no
// attribution required) standing in for actual product photography until
// the business's own catalog shoot exists. Category-based rather than
// per-product, since there's no real photo tied to a specific SKU yet — see
// Phase 7 of the plan, which is explicitly blocked on real content.
const CATEGORY_PHOTOS: Record<Category, string[]> = {
  dresses: [
    "photo-1616313253719-c46514cddee1",
    "photo-1633077705107-8f53a004218f",
    "photo-1762154057377-cc9d3dd6900c",
  ],
  tops: [
    "photo-1761117228880-df2425bd70da",
    "photo-1770294758906-c8762abb2c8b",
    "photo-1611235116156-0cbda6649efb",
  ],
  denim: [
    "photo-1602293589930-45aad59ba3ab",
    "photo-1475178626620-a4d074967452",
    "photo-1541099649105-f69ad21f3246",
  ],
  trousers: [
    "photo-1580651214613-f4692d6d138f",
    "photo-1551854838-212c50b4c184",
    "photo-1700676195099-75103510df39",
  ],
  skirts: [
    "photo-1708363390847-b4af54f45273",
    "photo-1590852669429-d1cd8775ea59",
    "photo-1598886221171-8e62de2c4e35",
  ],
  jewelry: [
    "photo-1585960622850-ed33c41d6418",
    "photo-1606760227091-3dd870d97f1d",
    "photo-1588444968576-f8fe92ce56fd",
  ],
  footwear: [
    "photo-1535043934128-cf0b28d52f95",
    "photo-1543163521-1bf539c55dd2",
    "photo-1596703263926-eb0762ee17e4",
  ],
  bags: [
    "photo-1691480250099-a63081ecfcb8",
    "photo-1751522917613-68281b131e45",
    "photo-1744722126362-6cf42ef07c4b",
  ],
  "hair-accessories": [
    "photo-1549236177-77e8271c34b6",
    "photo-1744177762258-c98418b7a4eb",
    "photo-1578220154766-1c39bcecc1dc",
  ],
};

function unsplashUrl(id: string, width: number): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// All three of a category's photos, reordered deterministically per product
// so neighbouring products in the same category don't all lead with the
// same shot in their gallery.
export function photosForProduct(id: string, category: Category, width = 1000): string[] {
  const ids = CATEGORY_PHOTOS[category];
  const offset = hashString(id) % ids.length;
  const rotated = [...ids.slice(offset), ...ids.slice(0, offset)];
  return rotated.map((photoId) => unsplashUrl(photoId, width));
}

export function heroPhotoForProduct(id: string, category: Category, width = 800): string {
  return photosForProduct(id, category, width)[0];
}

// A fixed representative shot for a whole category (homepage category
// tiles) — not hashed per-product since there's no product involved.
export function photoForCategory(category: Category, width = 600): string {
  return unsplashUrl(CATEGORY_PHOTOS[category][0], width);
}
