"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api";
import { formatLKR } from "@/lib/format";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper-raised p-5">
      <p className="text-xs tracking-wide text-ink-faint uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchDashboardSummary(token)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Dashboard</h1>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {summary && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total revenue" value={formatLKR(summary.totalRevenue)} />
            <StatCard label="Total orders" value={String(summary.orderCount)} />
            <StatCard label="Orders today" value={String(summary.todayOrderCount)} />
            <StatCard label="Pending orders" value={String(summary.pendingOrderCount)} />
          </div>

          <div className="mt-8 rounded-lg border border-line bg-paper-raised p-5">
            <h2 className="text-sm font-medium text-ink">Top products by units sold</h2>
            <div className="mt-3 divide-y divide-line">
              {summary.topProducts.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between py-2.5 text-sm transition hover:text-plum"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-4 text-ink-faint">{i + 1}</span>
                    <span>{p.name}</span>
                  </span>
                  <span className="tabular-nums text-ink-soft">{p.unitsSold} sold</span>
                </Link>
              ))}
              {summary.topProducts.length === 0 && <p className="py-2.5 text-sm text-ink-faint">No sales yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
