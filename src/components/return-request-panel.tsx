"use client";

import { useState } from "react";
import {
  createReturnRequest,
  fetchProductBySlug,
  type OrderItemSummary,
  type ReturnRequestSummary,
  type ReturnRequestType,
} from "@/lib/api";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<ReturnRequestSummary["status"], string> = {
  REQUESTED: "Pending review",
  REJECTED: "Rejected",
  REFUNDED: "Refunded to store credit",
  EXCHANGED: "Exchanged",
};

const STATUS_TONE: Record<ReturnRequestSummary["status"], string> = {
  REQUESTED: "text-gold",
  REJECTED: "text-ink-faint",
  REFUNDED: "text-success",
  EXCHANGED: "text-success",
};

interface VariantOption {
  id: string;
  size: string;
  color: string;
}

export function ReturnRequestPanel({
  token,
  item,
  eligible,
  existingRequests,
  onRequested,
}: {
  token: string;
  item: OrderItemSummary;
  eligible: boolean;
  existingRequests: ReturnRequestSummary[];
  onRequested: (request: ReturnRequestSummary) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReturnRequestType>("RETURN");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [variants, setVariants] = useState<VariantOption[] | null>(null);
  const [exchangeVariantId, setExchangeVariantId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (variants === null) {
      const product = await fetchProductBySlug(item.product.slug);
      const options = (product?.variants ?? []).filter(
        (v) => !(v.size === item.variant.size && v.color === item.variant.color)
      );
      setVariants(options);
      if (options.length > 0) setExchangeVariantId(options[0].id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    if (type === "EXCHANGE" && !exchangeVariantId) return;
    setSubmitting(true);
    setError(null);
    try {
      const request = await createReturnRequest(token, {
        orderItemId: item.id,
        type,
        qty,
        reason: reason.trim(),
        exchangeVariantId: type === "EXCHANGE" ? exchangeVariantId : undefined,
      });
      onRequested(request);
      setOpen(false);
      setReason("");
      setQty(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit that request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-1.5">
      {existingRequests.map((r) => (
        <p key={r.id} className="text-xs text-ink-faint">
          {r.type === "RETURN" ? "Return" : "Exchange"} requested ({r.qty}) &mdash;{" "}
          <span className={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</span>
        </p>
      ))}

      {eligible && !open && (
        <button
          type="button"
          onClick={handleOpen}
          className="text-xs font-medium text-plum underline underline-offset-4"
        >
          Request return / exchange
        </button>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-line p-3">
          <div className="flex gap-2">
            {(["RETURN", "EXCHANGE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  type === t ? "border-plum bg-cream text-plum" : "border-line-strong text-ink-soft"
                )}
              >
                {t === "RETURN" ? "Return for store credit" : "Exchange for another size/colour"}
              </button>
            ))}
          </div>

          {type === "EXCHANGE" && (
            <select
              value={exchangeVariantId}
              onChange={(e) => setExchangeVariantId(e.target.value)}
              className="rounded-lg border border-line-strong bg-paper-raised px-3 py-2 text-sm text-ink focus:border-plum focus:outline-none"
            >
              {variants === null && <option>Loading options&hellip;</option>}
              {variants?.length === 0 && <option>No other variants available</option>}
              {variants?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.color}, {v.size}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-faint">Qty</label>
            <input
              type="number"
              min={1}
              max={item.qty}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-16 rounded-lg border border-line-strong bg-paper-raised px-2 py-1.5 text-sm text-ink focus:border-plum focus:outline-none"
            />
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (e.g. doesn't fit, wrong colour)"
            rows={2}
            className="rounded-lg border border-line-strong bg-paper-raised px-3 py-2 text-sm text-ink focus:border-plum focus:outline-none"
          />

          {error && <p className="text-xs text-rose">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="rounded-full bg-plum px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-plum-deep disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-medium text-ink-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
