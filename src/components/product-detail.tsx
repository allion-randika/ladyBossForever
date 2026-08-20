"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Check } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductArt } from "@/components/product-art";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductDetail({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0].name);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const wishlistHydrated = useWishlistStore((s) => s.hasHydrated);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const isWishlisted = wishlistHydrated && wishlisted;
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const gallery = [0, 1, 2];
  const galleryRef = useRef<HTMLDivElement>(null);

  function handleGalleryScroll() {
    const el = galleryRef.current;
    if (!el || el.clientHeight === 0) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveImage((current) => (current === idx ? current : idx));
  }

  function scrollToImage(idx: number) {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
  }

  function handleAddToCart() {
    addItem(product.id, size, color, qty);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
      <div className="lg:sticky lg:top-20">
        <div className="flex gap-3">
          <div className="flex w-14 shrink-0 flex-col gap-3 sm:w-20">
            {gallery.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToImage(idx)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg ring-2 transition-all",
                  activeImage === idx ? "ring-plum" : "ring-transparent hover:ring-line-strong"
                )}
                style={{ filter: `hue-rotate(${idx * 6}deg)` }}
              >
                <ProductArt art={product.art} category={product.category} className="h-full w-full" />
              </button>
            ))}
          </div>

          <div
            ref={galleryRef}
            onScroll={handleGalleryScroll}
            className="no-scrollbar h-[70vh] flex-1 snap-y snap-mandatory overflow-y-auto rounded-2xl bg-cream lg:h-[calc(100vh-7rem)]"
          >
            {gallery.map((idx) => (
              <div key={idx} className="relative h-full w-full shrink-0 snap-start snap-always">
                <div style={{ filter: `hue-rotate(${idx * 6}deg)` }} className="h-full w-full">
                  <ProductArt art={product.art} category={product.category} className="h-full w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-ink-faint">
          {activeImage + 1} of {gallery.length} &mdash; scroll the image to see more
        </p>
      </div>

      <div>
        <h1 className="text-balance font-display text-3xl text-ink sm:text-4xl">{product.name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <p className="font-display text-2xl tabular-nums text-ink">{formatLKR(product.price)}</p>
          {product.compareAtPrice && (
            <p className="text-sm tabular-nums text-ink-faint line-through">
              {formatLKR(product.compareAtPrice)}
            </p>
          )}
        </div>

        <p className="mt-5 max-w-md text-ink-soft">{product.description}</p>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Colour &mdash; <span className="text-ink">{color}</span>
          </p>
          <div className="mt-2 flex gap-2">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                aria-label={c.name}
                aria-pressed={color === c.name}
                className={cn(
                  "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-paper transition-all",
                  color === c.name ? "ring-plum" : "ring-transparent hover:ring-line-strong"
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Size &mdash; <span className="text-ink">{size}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={cn(
                  "min-w-11 rounded-full border px-3 py-2 text-sm transition-colors",
                  size === s
                    ? "border-plum bg-plum text-white"
                    : "border-line-strong text-ink-soft hover:border-plum hover:text-plum"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-line-strong px-3 py-2.5">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="text-ink-soft"
              aria-label="Decrease quantity"
            >
              &minus;
            </button>
            <span className="w-4 text-center text-sm font-medium tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="text-ink-soft"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-white transition-colors",
              justAdded ? "bg-success" : "bg-plum hover:bg-plum-deep"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" /> Added to bag
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  Add to bag
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-pressed={isWishlisted}
            aria-label="Toggle wishlist"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-plum hover:text-plum"
          >
            <motion.span animate={isWishlisted ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
              <Heart className={cn("h-[18px] w-[18px]", isWishlisted && "fill-rose text-rose")} strokeWidth={1.75} />
            </motion.span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-[0.68rem] font-medium uppercase tracking-wider text-ink-faint">
          <span>3 or 4 installments with</span>
          <span className="text-ink-soft">Payzy</span>
          <span>&middot;</span>
          <span className="text-ink-soft">Mintpay</span>
          <span>&middot;</span>
          <span className="text-ink-soft">Koko</span>
        </div>

        <dl className="mt-9 space-y-2 border-t border-line pt-6">
          {product.details.map((d) => (
            <div key={d} className="flex gap-2 text-sm text-ink-soft">
              <span className="text-plum">&middot;</span>
              <span>{d}</span>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
