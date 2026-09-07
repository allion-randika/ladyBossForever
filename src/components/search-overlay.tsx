"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Loader2 } from "lucide-react";
import { fetchProducts } from "@/lib/api";
import { ProductPhoto } from "@/components/product-photo";
import { heroPhotoForProduct } from "@/lib/product-photos";
import { formatLKR } from "@/lib/format";
import type { Product } from "@/lib/types";

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 6;

interface SearchResponse {
  query: string;
  results: Product[];
}

export function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);

  // Fresh mount each time the overlay opens (parent unmounts it on close via
  // AnimatePresence), so this only needs to run once per open — no effect
  // dependent on `isOpen` required.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, []);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) return;
    const id = window.setTimeout(() => {
      fetchProducts({ q: trimmedQuery })
        .then((results) => setResponse({ query: trimmedQuery, results }))
        .catch(() => setResponse({ query: trimmedQuery, results: [] }));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [trimmedQuery]);

  const isLoading = trimmedQuery !== "" && response?.query !== trimmedQuery;
  const results = response?.query === trimmedQuery ? response.results : [];

  function goToResultsPage() {
    if (!trimmedQuery) return;
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto bg-paper-raised shadow-2xl"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 shrink-0 text-ink-faint" strokeWidth={1.75} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToResultsPage();
                    if (e.key === "Escape") onClose();
                  }}
                  placeholder="Search dresses, denim, jewelry…"
                  className="flex-1 bg-transparent font-display text-xl text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft hover:text-plum"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              {trimmedQuery && (
                <div className="mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-ink-faint">
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      <span className="text-sm">Searching&hellip;</span>
                    </div>
                  ) : results.length === 0 ? (
                    <p className="py-10 text-center text-ink-soft">
                      No products found for &ldquo;{trimmedQuery}&rdquo;.
                    </p>
                  ) : (
                    <>
                      <ul className="flex flex-col gap-1">
                        {results.slice(0, MAX_RESULTS).map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={onClose}
                              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-cream"
                            >
                              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg">
                                <ProductPhoto
                                  src={heroPhotoForProduct(product.id, product.category)}
                                  art={product.art}
                                  category={product.category}
                                  alt={product.name}
                                  className="h-full w-full"
                                  sizes="44px"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                                <p className="text-xs text-ink-faint">{formatLKR(product.price)}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={goToResultsPage}
                        className="mt-4 w-full rounded-full border border-line-strong py-2.5 text-sm font-medium text-ink transition-colors hover:border-plum hover:text-plum"
                      >
                        View all {results.length} result{results.length === 1 ? "" : "s"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
