"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductArt } from "@/components/product-art";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";

export function ProductCard({
  product,
  dark = false,
}: {
  product: Product;
  dark?: boolean;
}) {
  const wishlistHydrated = useWishlistStore((s) => s.hasHydrated);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const isWishlisted = wishlistHydrated && wishlisted;
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  const badge = product.badges[0];

  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream">
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.045 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductArt art={product.art} category={product.category} className="h-full w-full" />
          </motion.div>

          {badge && (
            <span
              className={cn(
                "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider",
                badge === "Sale"
                  ? "bg-rose text-white"
                  : "bg-paper-raised/90 text-ink backdrop-blur"
              )}
            >
              {badge}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper-raised/90 text-ink backdrop-blur transition-transform hover:scale-110"
          >
            <motion.span
              animate={isWishlisted ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <Heart
                className={cn("h-4 w-4", isWishlisted && "fill-rose text-rose")}
                strokeWidth={1.75}
              />
            </motion.span>
          </button>

          <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                addItem(product.id, product.sizes[0], product.colors[0].name);
              }}
              className="pointer-events-auto w-full rounded-full bg-ink/90 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper backdrop-blur transition-colors hover:bg-plum"
            >
              Quick add
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-start justify-between gap-2">
          <div>
            <h3 className={cn("text-sm font-medium", dark ? "text-white" : "text-ink")}>
              {product.name}
            </h3>
            <p
              className={cn(
                "mt-0.5 text-xs",
                dark ? "text-white/60" : "text-ink-faint"
              )}
            >
              {product.colors.length} colour{product.colors.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("text-sm font-medium tabular-nums", dark ? "text-white" : "text-ink")}>
              {formatLKR(product.price)}
            </p>
            {product.compareAtPrice && (
              <p
                className={cn(
                  "text-xs tabular-nums line-through",
                  dark ? "text-white/50" : "text-ink-faint"
                )}
              >
                {formatLKR(product.compareAtPrice)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
