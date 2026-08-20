"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { fetchAdminProducts, type AdminProduct } from "@/lib/api";
import { formatLKR } from "@/lib/format";

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canEdit = useAuthStore((s) => s.user?.role === "SUPER_ADMIN" || s.user?.role === "INVENTORY_MANAGER");

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAdminProducts(q ? { q } : undefined)
        .then(setProducts)
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  const totalStock = (p: AdminProduct) => p.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Products</h1>
        {canEdit && (
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-deep"
          >
            <Plus size={16} />
            New product
          </Link>
        )}
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-md border border-line bg-paper-raised py-2 pr-3 pl-9 text-sm focus:border-plum focus:outline-none"
        />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(products ?? []).map((p) => (
              <tr key={p.id} className="transition hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/products/${p.id}`} className="font-medium text-ink hover:text-plum">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-faint">{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.category.label}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{formatLKR(p.price)}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{totalStock(p)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {p.isNew && <span className="rounded bg-plum/10 px-1.5 py-0.5 text-xs text-plum">New</span>}
                    {p.isBestseller && (
                      <span className="rounded bg-warning-bg px-1.5 py-0.5 text-xs text-warning">Bestseller</span>
                    )}
                    {p.isOnSale && (
                      <span className="rounded bg-danger-bg px-1.5 py-0.5 text-xs text-danger">Sale</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {products !== null && products.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No products found.</p>
        )}
      </div>
    </div>
  );
}
