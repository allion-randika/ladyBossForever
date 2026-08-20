import { create } from "zustand";
import type { Product } from "@/lib/types";
import { fetchProducts } from "@/lib/api";
import { useCartStore } from "./cart-store";
import { useWishlistStore } from "./wishlist-store";

interface ProductCacheState {
  products: Product[];
  status: "idle" | "loading" | "ready" | "error";
  ensureLoaded: () => void;
}

export const useProductCacheStore = create<ProductCacheState>((set, get) => ({
  products: [],
  status: "idle",
  ensureLoaded: () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    fetchProducts()
      .then((products) => {
        set({ products, status: "ready" });

        // Cart/wishlist persist to localStorage by product id. If the
        // catalog changed underneath a returning visitor — a product was
        // removed, or (as happened once already) the whole id scheme
        // changed when the storefront moved off dummy data — stale
        // entries would otherwise sit invisibly in the count while
        // resolving to nothing in the UI. Drop them here, once, whenever
        // real product data loads.
        const validIds = new Set(products.map((p) => p.id));
        useCartStore.getState().pruneToValidProducts(validIds);
        useWishlistStore.getState().pruneToValidProducts(validIds);
      })
      .catch(() => set({ status: "error" }));
  },
}));
