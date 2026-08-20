import type { Product } from "./types";

export type SortOption = "featured" | "price-asc" | "price-desc" | "newest" | "name-asc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

export interface PriceBucket {
  id: string;
  label: string;
  test: (price: number) => boolean;
}

export const PRICE_BUCKETS: PriceBucket[] = [
  { id: "under-2000", label: "Under Rs. 2,000", test: (p) => p < 2000 },
  { id: "2000-5000", label: "Rs. 2,000 – 5,000", test: (p) => p >= 2000 && p <= 5000 },
  { id: "5000-8000", label: "Rs. 5,000 – 8,000", test: (p) => p > 5000 && p <= 8000 },
  { id: "over-8000", label: "Over Rs. 8,000", test: (p) => p > 8000 },
];

export function uniqueSizes(products: Product[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const p of products) {
    for (const s of p.sizes) {
      if (!seen.has(s)) {
        seen.add(s);
        order.push(s);
      }
    }
  }
  return order;
}

export function uniqueColors(products: Product[]): { name: string; hex: string }[] {
  const seen = new Map<string, string>();
  for (const p of products) {
    for (const c of p.colors) {
      if (!seen.has(c.name)) seen.set(c.name, c.hex);
    }
  }
  return Array.from(seen, ([name, hex]) => ({ name, hex }));
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return list.sort((a, b) => Number(b.badges.includes("New")) - Number(a.badges.includes("New")));
    case "featured":
    default:
      return list;
  }
}
