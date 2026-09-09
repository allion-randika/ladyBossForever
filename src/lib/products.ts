import type { Product } from "./types";

export function getNewArrivals(products: Product[], count = 8): Product[] {
  return products.filter((p) => p.badges.includes("New")).slice(0, count);
}

export function getBestsellers(products: Product[], count = 8): Product[] {
  return products.filter((p) => p.badges.includes("Bestseller")).slice(0, count);
}

export function getSaleProducts(products: Product[], count = 8): Product[] {
  return products.filter((p) => p.badges.includes("Sale")).slice(0, count);
}
