import Link from "next/link";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { fetchProducts } from "@/lib/api";
import { ShopBrowser } from "@/components/shop-browser";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category as Category | undefined;
  const products = await fetchProducts({ category: activeCategory });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose">Shop</p>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">
          {activeCategory ? categoryLabel(activeCategory) : "All products"}
        </h1>
      </div>

      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
        <FilterPill href="/shop" active={!activeCategory} label="All" />
        {CATEGORIES.map((c) => (
          <FilterPill
            key={c.slug}
            href={`/shop?category=${c.slug}`}
            active={activeCategory === c.slug}
            label={c.label}
          />
        ))}
      </div>

      <ShopBrowser key={activeCategory ?? "all"} products={products} />
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
        active
          ? "border-plum bg-plum text-white"
          : "border-line-strong text-ink-soft hover:border-plum hover:text-plum"
      )}
    >
      {label}
    </Link>
  );
}
