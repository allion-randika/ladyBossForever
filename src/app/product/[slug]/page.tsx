import { notFound } from "next/navigation";
import { getRelatedProducts } from "@/lib/products";
import { fetchProductBySlug, fetchProducts } from "@/lib/api";
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

  const categoryProducts = await fetchProducts({ category: product.category });
  const related = getRelatedProducts(categoryProducts, product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
