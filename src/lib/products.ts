import type { Product } from "./types";

export function getRelatedProducts(products: Product[], product: Product, count = 4): Product[] {
  return products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, count);
}

export function getNewArrivals(products: Product[], count = 8): Product[] {
  return products.filter((p) => p.badges.includes("New")).slice(0, count);
}

export function getBestsellers(products: Product[], count = 8): Product[] {
  return products.filter((p) => p.badges.includes("Bestseller")).slice(0, count);
}

export function getSaleProducts(products: Product[], count = 8): Product[] {
  return products.filter((p) => p.badges.includes("Sale")).slice(0, count);
}
