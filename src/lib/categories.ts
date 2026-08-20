import type { Category } from "./types";

export const CATEGORIES: { slug: Category; label: string; blurb: string }[] = [
  { slug: "dresses", label: "Dresses", blurb: "Occasion to everyday" },
  { slug: "tops", label: "Tops", blurb: "Crop, oversized, blouses" },
  { slug: "denim", label: "Denim", blurb: "Fitted to wide-leg" },
  { slug: "trousers", label: "Trousers", blurb: "Office to weekend" },
  { slug: "skirts", label: "Skirts", blurb: "Mini to midi" },
  { slug: "jewelry", label: "Jewelry", blurb: "Bracelets, earrings, necklaces" },
  { slug: "footwear", label: "Footwear", blurb: "Heels, flats, sandals" },
  { slug: "bags", label: "Bags", blurb: "Totes, slings, clutches" },
  { slug: "hair-accessories", label: "Hair", blurb: "Clips, scrunchies, bands" },
];

export function categoryLabel(slug: Category): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
