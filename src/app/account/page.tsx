"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { fetchMyOrders, type OrderSummary } from "@/lib/api";
import { clearGuestVisibleData } from "@/lib/session-sync";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<OrderSummary["status"], string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_TONE: Record<OrderSummary["status"], string> = {
  PENDING: "text-gold",
  PAID: "text-success",
  FULFILLED: "text-success",
  CANCELLED: "text-ink-faint",
  REFUNDED: "text-ink-faint",
};

export default function AccountPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const logout = useAuthStore((s) => s.logout);

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/account/login?redirect=%2Faccount");
      return;
    }
    fetchMyOrders(token)
      .then(setOrders)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load orders"));
  }, [hasHydrated, token, router]);

  if (!hasHydrated || !token) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose">Account</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{user?.email}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            clearGuestVisibleData();
            router.push("/");
          }}
          className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition-colors hover:border-plum hover:text-plum"
        >
          Sign out
        </button>
      </div>

      <h2 className="mt-10 mb-4 font-display text-xl text-ink">Order history</h2>

      {error && <p className="text-sm text-rose">{error}</p>}

      {!error && orders === null && <p className="text-ink-soft">Loading orders&hellip;</p>}

      {orders?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line py-16 text-center">
          <p className="text-ink-soft">No orders yet.</p>
          <Link
            href="/shop"
            className="rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            Start shopping
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-ink">Order #{order.number}</p>
                <span className={cn("text-xs font-semibold uppercase tracking-wider", STATUS_TONE[order.status])}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {new Date(order.createdAt).toLocaleDateString("en-LK", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <ul className="mt-3 flex flex-col gap-1">
                {order.items.map((item, i) => (
                  <li key={i} className="text-sm text-ink-soft">
                    {item.qty} &times; {item.product.name} ({item.variant.color}, {item.variant.size})
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium tabular-nums text-ink">Total {formatLKR(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
