"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  fetchCustomer,
  fetchCustomerStoreCredit,
  grantStoreCredit,
  type CustomerDetail,
  type StoreCreditLedger,
} from "@/lib/api";
import { formatLKR, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const canManageCredit = useAuthStore(
    (s) => s.user?.role === "SUPER_ADMIN" || s.user?.role === "ACCOUNTANT"
  );
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [ledger, setLedger] = useState<StoreCreditLedger | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    fetchCustomer(token, id)
      .then(setCustomer)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || !canManageCredit) return;
    fetchCustomerStoreCredit(token, id)
      .then(setLedger)
      .catch(() => setLedger(null));
  }, [token, id, canManageCredit]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    const amount = Number(grantAmount);
    if (!Number.isInteger(amount) || amount <= 0 || !grantReason.trim()) return;
    setGrantError(null);
    setGranting(true);
    try {
      const updated = await grantStoreCredit(token, id, { amount, reason: grantReason.trim() });
      setCustomer((c) => (c ? { ...c, storeCreditBalance: updated.storeCreditBalance } : c));
      const freshLedger = await fetchCustomerStoreCredit(token, id);
      setLedger(freshLedger);
      setGrantAmount("");
      setGrantReason("");
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "Failed to grant store credit");
    } finally {
      setGranting(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-faint">Loading…</p>;
  if (!customer) return <p className="text-sm text-danger">{error ?? "Customer not found"}</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-ink">
        {customer.firstName} {customer.lastName}
      </h1>

      <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg border border-line bg-paper-raised p-5 text-sm">
        <div>
          <p className="text-xs text-ink-faint uppercase">Email</p>
          <p className="mt-1 text-ink">{customer.email}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase">Phone</p>
          <p className="mt-1 text-ink">{customer.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase">Customer since</p>
          <p className="mt-1 text-ink">{formatDate(customer.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase">Birthday</p>
          <p className="mt-1 text-ink">{customer.birthday ? formatDate(customer.birthday) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase">Store credit</p>
          <p className="mt-1 font-medium tabular-nums text-ink">{formatLKR(customer.storeCreditBalance)}</p>
        </div>
      </div>

      {canManageCredit && (
        <div className="mt-6 rounded-lg border border-line bg-paper-raised p-5">
          <h2 className="text-sm font-medium text-ink">Store credit</h2>

          <form onSubmit={handleGrant} className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-ink-faint uppercase">Amount (LKR)</label>
              <input
                type="number"
                min={1}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                className="mt-1 block w-32 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-plum focus:outline-none"
              />
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-xs text-ink-faint uppercase">Reason</label>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="e.g. Goodwill credit for delayed order"
                className="mt-1 block w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-plum focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={granting || !grantAmount || !grantReason.trim()}
              className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
            >
              {granting ? "Granting…" : "Grant"}
            </button>
          </form>
          {grantError && <p className="mt-2 text-xs text-danger">{grantError}</p>}

          {ledger && ledger.transactions.length > 0 && (
            <div className="mt-4 space-y-1 border-t border-line pt-3">
              {ledger.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">
                    {tx.reason}
                    {tx.order && <span className="text-ink-faint"> · Order {tx.order.number}</span>}
                    <span className="text-ink-faint"> · {formatDateTime(tx.createdAt)}</span>
                  </span>
                  <span className={`tabular-nums ${tx.amount >= 0 ? "text-success" : "text-ink-faint"}`}>
                    {tx.amount >= 0 ? "+" : ""}
                    {formatLKR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {ledger && ledger.transactions.length === 0 && (
            <p className="mt-4 text-xs text-ink-faint">No store credit activity yet.</p>
          )}
        </div>
      )}

      <h2 className="mt-8 text-sm font-medium text-ink">Order history ({customer.orders.length})</h2>
      <div className="mt-3 space-y-3">
        {customer.orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-line bg-paper-raised p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{order.number}</p>
                <p className="text-xs text-ink-faint">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-sm font-medium tabular-nums text-ink">{formatLKR(order.total)}</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t border-line pt-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-ink-soft">
                  <span>
                    {item.product.name} — {item.variant.color}, {item.variant.size} × {item.qty}
                  </span>
                  <span className="tabular-nums">{formatLKR(item.unitPrice * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {customer.orders.length === 0 && <p className="text-sm text-ink-faint">No orders yet.</p>}
      </div>
    </div>
  );
}
