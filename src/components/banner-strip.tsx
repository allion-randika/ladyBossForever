import Link from "next/link";
import type { Banner } from "@/lib/api";
import { artForProduct } from "@/lib/art-palette";
import { EditorialArt } from "@/components/editorial-art";
import { Reveal } from "@/components/reveal";

export function BannerStrip({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {banners.map((banner, i) => (
          <Reveal key={banner.id} delay={i * 0.06}>
            <Link
              href={banner.ctaHref}
              className="group relative flex h-40 items-center overflow-hidden rounded-2xl px-8"
            >
              <EditorialArt art={artForProduct(banner.id)} className="absolute inset-0" />
              <div className="relative">
                <h3 className="text-balance font-display text-xl text-white sm:text-2xl">{banner.title}</h3>
                {banner.subtitle && <p className="mt-1 max-w-xs text-sm text-white/80">{banner.subtitle}</p>}
                <span className="mt-3 inline-block rounded-full bg-white/95 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-ink transition-colors group-hover:bg-white">
                  {banner.ctaLabel}
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
