"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import {
  fetchExpenses,
  createExpense,
  deleteExpense,
  ApiError,
  type Expense,
  type ExpenseCategory,
} from "@/lib/api";
import { formatLKR, formatDate } from "@/lib/format";

const CATEGORIES: ExpenseCategory[] = ["STOCK", "ADS", "SALARIES", "RENT", "PACKAGING", "OTHER"];

interface ExpenseDraft {
  category: ExpenseCategory;
  description: string;
  amount: string;
  incurredAt: string;
}

const EMPTY_DRAFT: ExpenseDraft = { category: "OTHER", description: "", amount: "", incurredAt: "" };

export default function ExpensesPage() {
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>({ ...EMPTY_DRAFT });
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchExpenses(token)
      .then(setExpenses)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setCreating(true);
    try {
      const created = await createExpense(token, {
        category: draft.category,
        description: draft.description,
        amount: Number(draft.amount),
        incurredAt: draft.incurredAt ? new Date(draft.incurredAt).toISOString() : undefined,
      });
      setExpenses((prev) => [created, ...(prev ?? [])]);
      setDraft({ ...EMPTY_DRAFT });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add expense");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(expense: Expense) {
    if (!token) return;
    const ok = await confirm({
      title: "Delete this expense?",
      description: `${expense.description} — ${formatLKR(expense.amount)}. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(expense.id);
    setError(null);
    try {
      await deleteExpense(token, expense.id);
      setExpenses((prev) => (prev ?? []).filter((x) => x.id !== expense.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  const total = (expenses ?? []).reduce((sum, x) => sum + x.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Expenses</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-deep"
        >
          <Plus size={16} />
          New expense
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Category</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ExpenseCategory }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Amount (Rs.)</label>
            <input
              required
              type="number"
              min={0}
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Description</label>
            <input
              required
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Date (optional)</label>
            <input
              type="date"
              value={draft.incurredAt}
              onChange={(e) => setDraft((d) => ({ ...d, incurredAt: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-faint">Defaults to today if left blank.</p>
          </div>

          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
            >
              {creating ? "Adding…" : "Add expense"}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(expenses ?? []).map((x) => (
              <tr key={x.id} className="transition hover:bg-paper">
                <td className="px-4 py-3 text-ink-soft">{formatDate(x.incurredAt)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-medium text-ink-faint">
                    {x.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">{x.description}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{formatLKR(x.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(x)}
                    disabled={busyId === x.id}
                    className="rounded-md p-1.5 text-ink-faint hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {expenses !== null && expenses.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No expenses recorded yet.</p>
        )}
        {expenses !== null && expenses.length > 0 && (
          <div className="border-t border-line px-4 py-3 text-right text-sm font-medium text-ink">
            Total {formatLKR(total)}
          </div>
        )}
      </div>
    </div>
  );
}
