"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useWishlistStore } from "@/store/wishlist-store";
import { useProductCacheStore } from "@/store/product-cache-store";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

export default function WishlistPage() {
  const wishlistHydrated = useWishlistStore((s) => s.hasHydrated);
  const ids = useWishlistStore((s) => s.ids);
  const products = useProductCacheStore((s) => s.products);
  const status = useProductCacheStore((s) => s.status);
  const ensureLoaded = useProductCacheStore((s) => s.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // Server always renders an empty wishlist (no localStorage there), so
  // nothing derived from `ids` can render for real until the store
  // finishes rehydrating client-side — otherwise the very first client
  // render (empty state vs. a product grid) can diverge from the server
  // HTML entirely, not just a class name.
  const isLoading = !wishlistHydrated || status === "idle" || status === "loading";
  const items = wishlistHydrated ? products.filter((p) => ids.includes(p.id)) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose">Saved</p>
      <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">Your wishlist</h1>

      {isLoading ? (
        <p className="py-20 text-center text-ink-soft">Loading your saved items&hellip;</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-ink-soft">Nothing saved yet &mdash; tap the heart on anything you love.</p>
          <Link
            href="/shop"
            className="mt-2 rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 8) * 0.04}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
