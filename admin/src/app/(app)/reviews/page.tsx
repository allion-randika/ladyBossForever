"use client";

import { useEffect, useState } from "react";
import { Star, Check, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import { fetchPendingReviews, approveReview, rejectReview, ApiError, type AdminReview } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function ReviewsPage() {
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchPendingReviews(token)
      .then(setReviews)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  async function handleApprove(id: string) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await approveReview(token, id);
      setReviews((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!token) return;
    const ok = await confirm({
      title: "Reject this review?",
      description: "It will be permanently removed and won't be visible on the storefront.",
      confirmLabel: "Reject",
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    setError(null);
    try {
      await rejectReview(token, id);
      setReviews((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Reviews</h1>
      <p className="mt-1 text-sm text-ink-faint">Pending moderation queue — approved reviews show on the storefront.</p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 space-y-3">
        {(reviews ?? []).map((review) => (
          <div key={review.id} className="rounded-lg border border-line bg-paper-raised p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      strokeWidth={1.5}
                      className={n <= review.rating ? "fill-warning text-warning" : "text-line-strong"}
                    />
                  ))}
                  <span className="ml-2 text-xs text-ink-faint">{formatDateTime(review.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink">
                  {review.product.name} &middot;{" "}
                  <span className="text-ink-soft">
                    {review.customer.firstName} {review.customer.lastName}
                  </span>
                </p>
                {review.title && <p className="mt-1 text-sm font-medium text-ink">{review.title}</p>}
                <p className="mt-1 text-sm text-ink-soft">{review.body}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleApprove(review.id)}
                  disabled={busyId === review.id}
                  className="flex items-center gap-1 rounded-md bg-success-bg px-3 py-1.5 text-xs font-medium text-success transition hover:opacity-80 disabled:opacity-50"
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(review.id)}
                  disabled={busyId === review.id}
                  className="flex items-center gap-1 rounded-md bg-danger-bg px-3 py-1.5 text-xs font-medium text-danger transition hover:opacity-80 disabled:opacity-50"
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews === null && <p className="py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {reviews !== null && reviews.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-faint">No reviews awaiting moderation.</p>
        )}
      </div>
    </div>
  );
}
