"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import {
  fetchAllReturnRequests,
  decideReturnRequest,
  ApiError,
  type ReturnRequestEntry,
} from "@/lib/api";
import { formatLKR, formatDateTime } from "@/lib/format";

const STATUS_TONE: Record<ReturnRequestEntry["status"], string> = {
  REQUESTED: "text-warning",
  REJECTED: "text-ink-faint",
  REFUNDED: "text-success",
  EXCHANGED: "text-success",
};

export default function ReturnsPage() {
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();
  const [requests, setRequests] = useState<ReturnRequestEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAllReturnRequests(token)
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  async function handleApprove(id: string) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      const updated = await decideReturnRequest(token, id, { decision: "APPROVE" });
      setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!token) return;
    const ok = await confirm({
      title: "Reject this request?",
      description: "The customer keeps the item as-is — no refund, no exchange, no stock changes.",
      confirmLabel: "Reject",
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    setError(null);
    try {
      const updated = await decideReturnRequest(token, id, { decision: "REJECT" });
      setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject");
    } finally {
      setBusyId(null);
    }
  }

  const pending = (requests ?? []).filter((r) => r.status === "REQUESTED");
  const decided = (requests ?? []).filter((r) => r.status !== "REQUESTED");

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Returns &amp; exchanges</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Approving a return refunds via store credit and restocks the item; approving an exchange swaps stock between
        the two variants.
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <h2 className="mt-6 text-sm font-medium text-ink">Pending ({pending.length})</h2>
      <div className="mt-3 space-y-3">
        {pending.map((r) => (
          <div key={r.id} className="rounded-lg border border-line bg-paper-raised p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {r.type === "RETURN" ? "Return" : "Exchange"} &middot; {r.orderItem.product.name}
                  <span className="ml-1 text-ink-faint">
                    ({r.orderItem.variant.color}, {r.orderItem.variant.size}) &times; {r.qty}
                  </span>
                </p>
                {r.exchangeVariant && (
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Exchange for {r.exchangeVariant.color}, {r.exchangeVariant.size}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-faint">
                  Order {r.order.number} &middot; {r.customer.firstName} {r.customer.lastName} ({r.customer.email})
                  &middot; {formatDateTime(r.createdAt)}
                </p>
                <p className="mt-1.5 text-sm text-ink-soft">&ldquo;{r.reason}&rdquo;</p>
                {r.type === "RETURN" && (
                  <p className="mt-1 text-xs text-ink-faint">
                    Refund if approved: {formatLKR(r.qty * r.orderItem.unitPrice)} store credit
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleApprove(r.id)}
                  disabled={busyId === r.id}
                  className="flex items-center gap-1 rounded-md bg-success-bg px-3 py-1.5 text-xs font-medium text-success transition hover:opacity-80 disabled:opacity-50"
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(r.id)}
                  disabled={busyId === r.id}
                  className="flex items-center gap-1 rounded-md bg-danger-bg px-3 py-1.5 text-xs font-medium text-danger transition hover:opacity-80 disabled:opacity-50"
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {requests !== null && pending.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">No requests awaiting a decision.</p>
        )}
        {requests === null && <p className="py-6 text-center text-sm text-ink-faint">Loading…</p>}
      </div>

      {decided.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium text-ink">Decided</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-paper-raised">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {decided.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-ink">
                      {r.orderItem.product.name}
                      <span className="ml-1 text-ink-faint">&times; {r.qty}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.order.number}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.customer.firstName} {r.customer.lastName}
                    </td>
                    <td className={`px-4 py-3 font-medium ${STATUS_TONE[r.status]}`}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
