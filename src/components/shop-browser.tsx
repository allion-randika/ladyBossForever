"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { PRICE_BUCKETS, SORT_OPTIONS, sortProducts, uniqueColors, uniqueSizes, type SortOption } from "@/lib/filters";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { FilterDrawer } from "@/components/filter-drawer";
import { cn } from "@/lib/cn";

export function ShopBrowser({ products }: { products: Product[] }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceBucket, setSelectedPriceBucket] = useState<string | null>(null);

  const sizes = useMemo(() => uniqueSizes(products), [products]);
  const colors = useMemo(() => uniqueColors(products), [products]);

  const filtered = useMemo(() => {
    const bucket = PRICE_BUCKETS.find((b) => b.id === selectedPriceBucket);
    const result = products.filter((p) => {
      const sizeMatch = selectedSizes.length === 0 || p.sizes.some((s) => selectedSizes.includes(s));
      const colorMatch =
        selectedColors.length === 0 || p.colors.some((c) => selectedColors.includes(c.name));
      const priceMatch = !bucket || bucket.test(p.price);
      return sizeMatch && colorMatch && priceMatch;
    });
    return sortProducts(result, sort);
  }, [products, selectedSizes, selectedColors, selectedPriceBucket, sort]);

  function toggleSize(size: string) {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  }

  function clearAll() {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceBucket(null);
  }

  const activeCount = selectedSizes.length + selectedColors.length + (selectedPriceBucket ? 1 : 0);
  const priceLabel = PRICE_BUCKETS.find((b) => b.id === selectedPriceBucket)?.label;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-y border-line py-3">
        <p className="text-xs tabular-nums text-ink-faint">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none rounded-full border border-line-strong bg-transparent py-2 pl-4 pr-9 text-sm text-ink transition-colors hover:border-plum focus:border-plum focus:outline-none"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
              strokeWidth={1.75}
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-plum hover:text-plum"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
            Filters
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-plum px-1 text-[0.65rem] font-semibold tabular-nums text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-4">
          {priceLabel && (
            <ActiveChip label={priceLabel} onRemove={() => setSelectedPriceBucket(null)} />
          )}
          {selectedSizes.map((s) => (
            <ActiveChip key={s} label={`Size ${s}`} onRemove={() => toggleSize(s)} />
          ))}
          {selectedColors.map((c) => (
            <ActiveChip key={c} label={c} onRemove={() => toggleColor(c)} />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-ink-faint underline underline-offset-4 hover:text-plum"
          >
            Clear all
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-ink-soft">No products match those filters.</p>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 8) * 0.04}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        sizes={sizes}
        colors={colors}
        selectedSizes={selectedSizes}
        selectedColors={selectedColors}
        selectedPriceBucket={selectedPriceBucket}
        onToggleSize={toggleSize}
        onToggleColor={toggleColor}
        onSetPriceBucket={setSelectedPriceBucket}
        onClearAll={clearAll}
        resultCount={filtered.length}
      />
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-line-strong bg-paper-raised px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-plum hover:text-plum"
      )}
    >
      {label}
      <X className="h-3 w-3" strokeWidth={2} />
    </button>
  );
}
