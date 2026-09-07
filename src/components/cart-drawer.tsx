"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useCartStore, cartSubtotal } from "@/store/cart-store";
import { useProductCacheStore } from "@/store/product-cache-store";
import { ProductPhoto } from "@/components/product-photo";
import { heroPhotoForProduct } from "@/lib/product-photos";
import { formatLKR } from "@/lib/format";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);

  const products = useProductCacheStore((s) => s.products);
  const ensureLoaded = useProductCacheStore((s) => s.ensureLoaded);
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const subtotal = cartSubtotal(lines, products);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper-raised shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Your bag ({lines.length})</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-plum"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="text-ink-soft">Your bag is empty.</p>
                  <Link
                    href="/shop"
                    onClick={close}
                    className="text-xs font-semibold uppercase tracking-wider text-plum underline underline-offset-4"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => {
                      const product = products.find((p) => p.id === line.productId);
                      if (!product) return null;
                      return (
                        <motion.li
                          key={`${line.productId}-${line.size}-${line.color}`}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-3"
                        >
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={close}
                            className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg"
                          >
                            <ProductPhoto
                              src={heroPhotoForProduct(product.id, product.category)}
                              art={product.art}
                              category={product.category}
                              alt={product.name}
                              className="h-full w-full"
                              sizes="64px"
                            />
                          </Link>
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-ink">{product.name}</p>
                                <p className="mt-0.5 text-xs text-ink-faint">
                                  {line.color} &middot; {line.size}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLine(line.productId, line.size, line.color)}
                                aria-label="Remove item"
                                className="text-ink-faint hover:text-rose"
                              >
                                <X className="h-4 w-4" strokeWidth={1.75} />
                              </button>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2 rounded-full border border-line px-1.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => setQty(line.productId, line.size, line.color, line.qty - 1)}
                                  disabled={line.qty <= 1}
                                  className="flex h-5 w-5 items-center justify-center text-ink-soft disabled:opacity-30"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-medium tabular-nums">{line.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => setQty(line.productId, line.size, line.color, line.qty + 1)}
                                  className="flex h-5 w-5 items-center justify-center text-ink-soft"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-sm font-medium tabular-nums text-ink">{formatLKR(product.price * line.qty)}</p>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-line px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Subtotal</span>
                  <span className="font-display text-lg tabular-nums text-ink">{formatLKR(subtotal)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={close}
                  className="block w-full rounded-full bg-plum py-3 text-center text-sm font-medium text-white transition-colors hover:bg-plum-deep"
                >
                  Checkout
                </Link>
                <p className="mt-2 text-center text-[0.65rem] text-ink-faint">
                  Shipping &amp; installments (Payzy/Mintpay/Koko) calculated at checkout
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

