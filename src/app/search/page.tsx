import { fetchProducts } from "@/lib/api";
import { ShopBrowser } from "@/components/shop-browser";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await fetchProducts({ q: query }) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose">Search</p>
        <h1 className="mt-1 text-balance font-display text-3xl text-ink sm:text-4xl">
          {query ? (
            <>
              Results for &ldquo;{query}&rdquo;
            </>
          ) : (
            "Search Lady Boss"
          )}
        </h1>
      </div>

      {!query ? (
        <p className="py-16 text-center text-ink-soft">Enter a search term to find products.</p>
      ) : (
        <ShopBrowser key={query} products={products} />
      )}
    </div>
  );
}
