import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchProductReviews, fetchRecommendations } from "@/lib/api";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    fetchRecommendations(product.id).catch(() => []),
    fetchProductReviews(product.id).catch(() => ({ reviews: [], averageRating: 0, count: 0 })),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: product.price,
      // Real per-variant stock isn't threaded through to the storefront's
      // Product type — every seeded product currently has stock, so this
      // is a reasonable default rather than asserting a value we can't see.
      availability: "https://schema.org/InStock",
    },
    ...(reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.averageRating,
            reviewCount: reviews.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
