"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { fetchCustomers, type CustomerListItem } from "@/lib/api";
import { formatDate, formatLKR } from "@/lib/format";

export default function CustomersPage() {
  const token = useAuthStore((s) => s.token);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchCustomers(token)
      .then(setCustomers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Customers</h1>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Store credit</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => (
              <tr key={c.id} className="transition hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`} className="font-medium text-ink hover:text-plum">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.email}</td>
                <td className="px-4 py-3 text-ink-soft">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{c._count.orders}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">
                  {c.storeCreditBalance > 0 ? formatLKR(c.storeCreditBalance) : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && customers.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No customers found.</p>
        )}
      </div>
    </div>
  );
}
