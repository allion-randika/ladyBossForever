"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { purchaseGiftCard, type GiftCard } from "@/lib/api";
import { formatLKR } from "@/lib/format";

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];

export default function GiftCardsPage() {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isLoggedIn = hasHydrated && Boolean(token);

  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [purchased, setPurchased] = useState<GiftCard | null>(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const card = await purchaseGiftCard(token, {
        amount: effectiveAmount,
        recipientEmail,
        recipientName: recipientName || undefined,
        message: message || undefined,
      });
      setPurchased(card);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't complete the purchase");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasHydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose">Gift cards</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Sign in to buy a gift card</h1>
        <p className="mt-3 text-ink-soft">Gift cards are tied to your account so you can track balances and history.</p>
        <Link
          href="/account/login?redirect=%2Fgift-cards"
          className="mt-6 inline-block rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (purchased) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose">Gift card purchased</p>
        <h1 className="mt-1 font-display text-3xl text-ink">{formatLKR(purchased.initialBalance)}</h1>
        <p className="mt-4 rounded-2xl border border-line bg-cream px-6 py-4 font-mono text-lg tracking-wide text-ink">
          {purchased.code}
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          Sent to <span className="font-medium text-ink">{purchased.recipientEmail}</span>. This code can be applied
          at checkout by the recipient, or you can share it directly.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/gift-cards"
            onClick={() => setPurchased(null)}
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink-soft transition-colors hover:border-plum hover:text-plum"
          >
            Buy another
          </Link>
          <Link
            href="/account"
            className="rounded-full bg-plum px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            View my gift cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose">Gift cards</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Give a Lady Boss gift card</h1>
      <p className="mt-3 text-ink-soft">Delivered as a code, redeemable at checkout for anything in the store.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Amount</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount("");
                }}
                aria-pressed={!customAmount && amount === preset}
                className={`rounded-xl border py-3 text-sm font-medium transition-colors ${
                  !customAmount && amount === preset
                    ? "border-plum bg-cream text-plum"
                    : "border-line-strong text-ink-soft hover:border-plum"
                }`}
              >
                {formatLKR(preset)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={500}
            placeholder="Or enter a custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
          />
        </div>

        <input
          type="email"
          required
          placeholder="Recipient email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
        />
        <input
          type="text"
          placeholder="Recipient name (optional)"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
        />
        <textarea
          rows={3}
          placeholder="Gift message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
        />

        {error && <p className="text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !effectiveAmount || effectiveAmount < 500 || !recipientEmail}
          className="rounded-full bg-plum py-3.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep disabled:opacity-60"
        >
          {submitting ? "Purchasing…" : `Buy gift card — ${formatLKR(effectiveAmount || 0)}`}
        </button>
      </form>
    </div>
  );
}
