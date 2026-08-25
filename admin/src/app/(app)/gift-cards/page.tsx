"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { fetchGiftCards, issueGiftCard, ApiError, type AdminGiftCard } from "@/lib/api";
import { formatLKR, formatDate } from "@/lib/format";

interface IssueDraft {
  amount: string;
  recipientEmail: string;
  recipientName: string;
  message: string;
  expiresAt: string;
}

const EMPTY_DRAFT: IssueDraft = { amount: "", recipientEmail: "", recipientName: "", message: "", expiresAt: "" };

const STATUS_STYLES: Record<AdminGiftCard["status"], string> = {
  ACTIVE: "bg-success-bg text-success",
  REDEEMED: "bg-line text-ink-faint",
  DISABLED: "bg-danger-bg text-danger",
};

export default function GiftCardsPage() {
  const token = useAuthStore((s) => s.token);
  const [giftCards, setGiftCards] = useState<AdminGiftCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<IssueDraft>({ ...EMPTY_DRAFT });
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchGiftCards(token)
      .then(setGiftCards)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setIssuing(true);
    try {
      const created = await issueGiftCard(token, {
        amount: Number(draft.amount),
        recipientEmail: draft.recipientEmail,
        recipientName: draft.recipientName || undefined,
        message: draft.message || undefined,
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : undefined,
      });
      setGiftCards((prev) => [created, ...(prev ?? [])]);
      setDraft({ ...EMPTY_DRAFT });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to issue gift card");
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Gift cards</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-deep"
        >
          <Plus size={16} />
          Issue gift card
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleIssue}
          className="mt-6 grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Amount (Rs.)</label>
            <input
              required
              type="number"
              min={1}
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
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
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Recipient email</label>
            <input
              required
              type="email"
              value={draft.recipientEmail}
              onChange={(e) => setDraft((d) => ({ ...d, recipientEmail: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Recipient name (optional)</label>
            <input
              value={draft.recipientName}
              onChange={(e) => setDraft((d) => ({ ...d, recipientName: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Message (optional)</label>
            <input
              value={draft.message}
              onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>

          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

          <div className="col-span-2">
            <button
              type="submit"
              disabled={issuing}
              className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
            >
              {issuing ? "Issuing…" : "Issue gift card"}
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
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(giftCards ?? []).map((c) => (
              <tr key={c.id} className="transition hover:bg-paper">
                <td className="px-4 py-3 font-mono text-xs text-ink">{c.code}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {c.recipientName || c.recipientEmail}
                  <p className="text-xs text-ink-faint">{c.recipientEmail}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">
                  {formatLKR(c.balance)} <span className="text-ink-faint">/ {formatLKR(c.initialBalance)}</span>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {c.purchaser ? c.purchaser.email : c.issuedByAdmin ? `Issued by ${c.issuedByAdmin.name}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {giftCards === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {giftCards !== null && giftCards.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No gift cards yet.</p>
        )}
      </div>
    </div>
  );
}
