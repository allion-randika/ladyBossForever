import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchBlogPost } from "@/lib/api";
import { artForProduct } from "@/lib/art-palette";
import { EditorialArt } from "@/components/editorial-art";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) notFound();

  const paragraphs = post.body.split(/\n{2,}/).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ?? undefined,
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-xs font-semibold uppercase tracking-wider text-plum underline underline-offset-4">
        &larr; Journal
      </Link>

      <p className="mt-6 text-xs text-ink-faint">
        {post.publishedAt &&
          new Date(post.publishedAt).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <h1 className="mt-1 text-balance font-display text-3xl text-ink sm:text-4xl">{post.title}</h1>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
        <EditorialArt art={artForProduct(post.id)} className="h-full w-full" />
      </div>

      <div className="prose-content mt-8 flex flex-col gap-4 text-ink-soft">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
