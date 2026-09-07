"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompareStore } from "@/store/compare-store";
import { useProductCacheStore } from "@/store/product-cache-store";
import { ProductPhoto } from "@/components/product-photo";
import { heroPhotoForProduct } from "@/lib/product-photos";
import { formatLKR } from "@/lib/format";

export default function ComparePage() {
  const compareHydrated = useCompareStore((s) => s.hasHydrated);
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const products = useProductCacheStore((s) => s.products);
  const status = useProductCacheStore((s) => s.status);
  const ensureLoaded = useProductCacheStore((s) => s.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const isLoading = !compareHydrated || status === "idle" || status === "loading";
  // Preserve the order items were added in, rather than catalog order.
  const items = compareHydrated ? ids.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose">Compare</p>
          <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">Side by side</h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-ink-soft underline underline-offset-4 hover:text-plum"
          >
            Clear all
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="py-20 text-center text-ink-soft">Loading&hellip;</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-ink-soft">
            Nothing to compare yet &mdash; tap the compare icon on any product to add it here.
          </p>
          <Link
            href="/shop"
            className="mt-2 rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(220px, 1fr))` }}
          >
            {items.map((product) => (
              <div key={product.id} className="flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream">
                  <ProductPhoto
                    src={heroPhotoForProduct(product.id, product.category)}
                    art={product.art}
                    category={product.category}
                    alt={product.name}
                    className="h-full w-full"
                    sizes="220px"
                  />
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    aria-label="Remove from compare"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper-raised/90 text-ink backdrop-blur transition-transform hover:scale-110"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
                <Link href={`/product/${product.slug}`} className="mt-3 text-sm font-medium text-ink hover:text-plum">
                  {product.name}
                </Link>

                <dl className="mt-4 flex flex-col gap-3 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-faint">Price</dt>
                    <dd className="mt-0.5 tabular-nums text-ink">
                      {formatLKR(product.price)}
                      {product.compareAtPrice && (
                        <span className="ml-1.5 text-xs text-ink-faint line-through">
                          {formatLKR(product.compareAtPrice)}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-faint">Category</dt>
                    <dd className="mt-0.5 text-ink-soft capitalize">{product.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-faint">Colours</dt>
                    <dd className="mt-1 flex gap-1.5">
                      {product.colors.map((c) => (
                        <span
                          key={c.name}
                          title={c.name}
                          className="h-5 w-5 rounded-full ring-1 ring-line-strong"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-faint">Sizes</dt>
                    <dd className="mt-0.5 text-ink-soft">{product.sizes.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-faint">Details</dt>
                    <dd className="mt-1 flex flex-col gap-1 text-xs text-ink-soft">
                      {product.details.map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
