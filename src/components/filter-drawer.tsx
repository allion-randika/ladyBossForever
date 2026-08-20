"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { PRICE_BUCKETS } from "@/lib/filters";

export function FilterDrawer({
  isOpen,
  onClose,
  sizes,
  colors,
  selectedSizes,
  selectedColors,
  selectedPriceBucket,
  onToggleSize,
  onToggleColor,
  onSetPriceBucket,
  onClearAll,
  resultCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  sizes: string[];
  colors: { name: string; hex: string }[];
  selectedSizes: string[];
  selectedColors: string[];
  selectedPriceBucket: string | null;
  onToggleSize: (size: string) => void;
  onToggleColor: (color: string) => void;
  onSetPriceBucket: (id: string | null) => void;
  onClearAll: () => void;
  resultCount: number;
}) {
  const hasActive = selectedSizes.length > 0 || selectedColors.length > 0 || !!selectedPriceBucket;

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
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-paper-raised shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Filters</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-plum"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterSection title="Price">
                <div className="flex flex-wrap gap-2">
                  {PRICE_BUCKETS.map((bucket) => (
                    <Chip
                      key={bucket.id}
                      label={bucket.label}
                      active={selectedPriceBucket === bucket.id}
                      onClick={() =>
                        onSetPriceBucket(selectedPriceBucket === bucket.id ? null : bucket.id)
                      }
                    />
                  ))}
                </div>
              </FilterSection>

              {sizes.length > 0 && (
                <FilterSection title="Size">
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        active={selectedSizes.includes(s)}
                        onClick={() => onToggleSize(s)}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {colors.length > 0 && (
                <FilterSection title="Colour">
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => {
                      const active = selectedColors.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => onToggleColor(c.name)}
                          aria-pressed={active}
                          aria-label={c.name}
                          title={c.name}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-paper-raised transition-all",
                            active ? "ring-plum" : "ring-transparent hover:ring-line-strong"
                          )}
                          style={{ backgroundColor: c.hex }}
                        >
                          {active && (
                            <Check
                              className="h-4 w-4"
                              strokeWidth={2.5}
                              style={{
                                color: isLight(c.hex) ? "#241a20" : "#ffffff",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={onClearAll}
                disabled={!hasActive}
                className="text-sm font-medium text-ink-soft underline underline-offset-4 disabled:opacity-30"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-plum py-3 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
              >
                Show {resultCount} result{resultCount === 1 ? "" : "s"}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-5 pt-5 first:pt-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</p>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-plum bg-plum text-white"
          : "border-line-strong text-ink-soft hover:border-plum hover:text-plum"
      )}
    >
      {label}
    </button>
  );
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
