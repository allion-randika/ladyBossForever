"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { fetchAdminOrders, updateOrderStatus, ApiError, type AdminOrder, type OrderStatus } from "@/lib/api";
import { formatLKR, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];

export default function OrdersPage() {
  const token = useAuthStore((s) => s.token);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminOrders(token, filter || undefined)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token, filter]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!token) return;
    setUpdatingId(orderId);
    setError(null);
    try {
      const updated = await updateOrderStatus(token, orderId, status);
      setOrders((prev) => (prev ? prev.map((o) => (o.id === orderId ? updated : o)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Orders</h1>

      <div className="mt-6 flex gap-1.5">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            filter === "" ? "bg-plum text-white" : "bg-paper-raised text-ink-soft"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === s ? "bg-plum text-white" : "bg-paper-raised text-ink-soft"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Placed</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="transition hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/customers/${o.customer.id}`} className="font-medium text-ink hover:text-plum">
                    {o.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {o.customer.firstName} {o.customer.lastName}
                  <p className="text-xs text-ink-faint">{o.customer.email}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{formatLKR(o.total)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <select
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                      className="rounded-md border border-line bg-paper-raised px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {orders !== null && orders.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No orders found.</p>
        )}
      </div>
    </div>
  );
}
