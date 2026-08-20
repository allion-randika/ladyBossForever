export type Category =
  | "tops"
  | "dresses"
  | "denim"
  | "trousers"
  | "skirts"
  | "jewelry"
  | "footwear"
  | "bags"
  | "hair-accessories";

export type Badge = "New" | "Bestseller" | "Sale";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ArtSpec {
  from: string;
  to: string;
  accent: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  compareAtPrice?: number;
  colors: ColorOption[];
  sizes: string[];
  variants: ProductVariant[];
  badges: Badge[];
  description: string;
  details: string[];
  art: ArtSpec;
}

export interface CartLine {
  productId: string;
  size: string;
  color: string;
  qty: number;
}
