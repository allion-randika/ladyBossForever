import Link from "next/link";
import { fetchBlogPosts } from "@/lib/api";
import { artForProduct } from "@/lib/art-palette";
import { EditorialArt } from "@/components/editorial-art";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose">Journal</p>
      <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">Style notes &amp; stories</h1>

      {posts.length === 0 ? (
        <p className="mt-10 text-ink-soft">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 6) * 0.05}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <EditorialArt art={artForProduct(post.id)} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                </div>
                <p className="mt-3 text-xs text-ink-faint">
                  {post.publishedAt &&
                    new Date(post.publishedAt).toLocaleDateString("en-LK", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </p>
                <h2 className="mt-1 font-display text-xl text-ink group-hover:text-plum">{post.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">{post.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
