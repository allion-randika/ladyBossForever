import Link from "next/link";
import { Hero } from "@/components/hero";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { CategoryTiles } from "@/components/category-tiles";
import { BannerStrip } from "@/components/banner-strip";
import { getBestsellers, getNewArrivals, getSaleProducts } from "@/lib/products";
import { fetchProducts, fetchBanners } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, banners] = await Promise.all([fetchProducts(), fetchBanners()]);
  const newArrivals = getNewArrivals(products, 4);
  const bestsellers = getBestsellers(products, 4);
  const sale = getSaleProducts(products, 4);

  return (
    <div>
      <Hero />

      <BannerStrip banners={banners} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose">Just landed</p>
              <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">New arrivals</h2>
            </div>
            <Link href="/shop" className="text-xs font-semibold uppercase tracking-wider text-plum underline underline-offset-4">
              View all
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {newArrivals.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose">Shop by category</p>
            <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Find your fit</h2>
          </Reveal>
          <div className="mt-8">
            <CategoryTiles />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose">Customer favourites</p>
              <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Bestsellers</h2>
            </div>
            <Link href="/shop" className="text-xs font-semibold uppercase tracking-wider text-plum underline underline-offset-4">
              View all
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {bestsellers.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-plum">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-soft">Limited time</p>
                <h2 className="mt-1 font-display text-2xl text-white sm:text-3xl">On sale now</h2>
              </div>
              <Link href="/shop" className="text-xs font-semibold uppercase tracking-wider text-rose-soft underline underline-offset-4">
                Shop the sale
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {sale.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <ProductCard product={p} dark />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
