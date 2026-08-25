"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import {
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  ApiError,
  type Discount,
  type DiscountType,
} from "@/lib/api";
import { formatLKR, formatDate } from "@/lib/format";

interface DiscountDraft {
  code: string;
  type: DiscountType;
  value: string;
  minOrderAmount: string;
  usageLimit: string;
  expiresAt: string;
}

const EMPTY_DRAFT: DiscountDraft = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  usageLimit: "",
  expiresAt: "",
};

function formatValue(discount: Discount) {
  return discount.type === "PERCENTAGE" ? `${discount.value}%` : formatLKR(discount.value);
}

export default function PromotionsPage() {
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();
  const [discounts, setDiscounts] = useState<Discount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DiscountDraft>({ ...EMPTY_DRAFT });
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchDiscounts(token)
      .then(setDiscounts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setCreating(true);
    try {
      const created = await createDiscount(token, {
        code: draft.code,
        type: draft.type,
        value: Number(draft.value),
        minOrderAmount: draft.minOrderAmount ? Number(draft.minOrderAmount) : undefined,
        usageLimit: draft.usageLimit ? Number(draft.usageLimit) : undefined,
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : undefined,
      });
      setDiscounts((prev) => [created, ...(prev ?? [])]);
      setDraft({ ...EMPTY_DRAFT });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create discount code");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(discount: Discount) {
    if (!token) return;
    setBusyId(discount.id);
    setError(null);
    try {
      const updated = await updateDiscount(token, discount.id, { isActive: !discount.isActive });
      setDiscounts((prev) => (prev ?? []).map((d) => (d.id === discount.id ? updated : d)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(discount: Discount) {
    if (!token) return;
    const ok = await confirm({
      title: `Delete code "${discount.code}"?`,
      description: "This code will no longer be usable at checkout. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(discount.id);
    setError(null);
    try {
      await deleteDiscount(token, discount.id);
      setDiscounts((prev) => (prev ?? []).filter((d) => d.id !== discount.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Promotions</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-deep"
        >
          <Plus size={16} />
          New code
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Code</label>
            <input
              required
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
              placeholder="SUMMER10"
              className="w-full rounded-md border border-line px-3 py-2 text-sm uppercase focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Type</label>
            <select
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as DiscountType }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount (Rs.)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">
              Value {draft.type === "PERCENTAGE" ? "(%)" : "(Rs.)"}
            </label>
            <input
              required
              type="number"
              min={1}
              max={draft.type === "PERCENTAGE" ? 100 : undefined}
              value={draft.value}
              onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Min. order (Rs., optional)</label>
            <input
              type="number"
              min={0}
              value={draft.minOrderAmount}
              onChange={(e) => setDraft((d) => ({ ...d, minOrderAmount: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Usage limit (optional)</label>
            <input
              type="number"
              min={1}
              value={draft.usageLimit}
              onChange={(e) => setDraft((d) => ({ ...d, usageLimit: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Expires (optional)</label>
            <input
              type="date"
              value={draft.expiresAt}
              onChange={(e) => setDraft((d) => ({ ...d, expiresAt: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>

          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create code"}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Min. order</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(discounts ?? []).map((d) => (
              <tr key={d.id} className="transition hover:bg-paper">
                <td className="px-4 py-3 font-medium text-ink">{d.code}</td>
                <td className="px-4 py-3 text-ink-soft">{formatValue(d)}</td>
                <td className="px-4 py-3 text-ink-soft">{d.minOrderAmount ? formatLKR(d.minOrderAmount) : "—"}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">
                  {d.usageCount}
                  {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3 text-ink-soft">{d.expiresAt ? formatDate(d.expiresAt) : "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(d)}
                    disabled={busyId === d.id}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
                      d.isActive ? "bg-success-bg text-success" : "bg-line text-ink-faint"
                    }`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(d)}
                    disabled={busyId === d.id || d.usageCount > 0}
                    title={d.usageCount > 0 ? "Already used — deactivate instead" : "Delete"}
                    className="rounded-md p-1.5 text-ink-faint hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {discounts === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {discounts !== null && discounts.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No promo codes yet.</p>
        )}
      </div>
    </div>
  );
}
