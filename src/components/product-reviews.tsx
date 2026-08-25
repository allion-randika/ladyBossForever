"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { fetchProductReviews, submitReview, type ProductReviews as ProductReviewsData } from "@/lib/api";
import { cn } from "@/lib/cn";

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          strokeWidth={1.5}
          className={n <= Math.round(rating) ? "fill-gold text-gold" : "text-line-strong"}
        />
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isLoggedIn = hasHydrated && Boolean(token);

  const [data, setData] = useState<ProductReviewsData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductReviews(productId)
      .then(setData)
      .catch(() => setData({ reviews: [], averageRating: 0, count: 0 }));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await submitReview(token, productId, { rating, title: title || undefined, body });
      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-5xl border-t border-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink">Reviews</h2>
          {data && data.count > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <StarRow rating={data.averageRating} />
              <span className="text-sm text-ink-soft">
                {data.averageRating.toFixed(1)} ({data.count} review{data.count === 1 ? "" : "s"})
              </span>
            </div>
          )}
        </div>
        {isLoggedIn && !showForm && !submitted && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition-colors hover:border-plum hover:text-plum"
          >
            Write a review
          </button>
        )}
      </div>

      {submitted && (
        <p className="mt-6 rounded-lg bg-cream px-4 py-3 text-sm text-ink">
          Thanks — your review is submitted and will show once it&rsquo;s approved.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-2xl border border-line p-5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star
                  width={22}
                  height={22}
                  strokeWidth={1.5}
                  className={cn(n <= rating ? "fill-gold text-gold" : "text-line-strong")}
                />
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
          />
          <textarea
            required
            rows={4}
            placeholder="Tell other shoppers what you thought"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
          />
          {error && <p className="text-sm text-rose">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-plum px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink-soft transition-colors hover:border-plum"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {data?.reviews.length === 0 && !submitted && (
        <p className="mt-6 text-sm text-ink-faint">No reviews yet — be the first to share your thoughts.</p>
      )}

      {data && data.reviews.length > 0 && (
        <ul className="mt-6 flex flex-col gap-5">
          {data.reviews.map((review) => (
            <li key={review.id} className="border-b border-line pb-5 last:border-0">
              <div className="flex items-center gap-2">
                <StarRow rating={review.rating} size={14} />
                <span className="text-xs text-ink-faint">
                  {review.customer.firstName} {review.customer.lastName.charAt(0)}.
                </span>
              </div>
              {review.title && <p className="mt-1.5 text-sm font-medium text-ink">{review.title}</p>}
              <p className="mt-1 text-sm text-ink-soft">{review.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
