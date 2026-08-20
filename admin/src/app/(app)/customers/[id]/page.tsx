"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { fetchCustomer, type CustomerDetail } from "@/lib/api";
import { formatLKR, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    fetchCustomer(token, id)
      .then(setCustomer)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, id]);

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
      </div>

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
