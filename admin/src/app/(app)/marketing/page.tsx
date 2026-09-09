"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { fetchEmailLog, runAbandonedCartCheck, type EmailLogEntry, type EmailType } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const TYPE_LABEL: Record<EmailType, string> = {
  WELCOME: "Welcome",
  ORDER_CONFIRMATION: "Order confirmation",
  ABANDONED_CART: "Abandoned cart",
  BACK_IN_STOCK: "Back in stock",
  PRICE_DROP: "Price drop",
  BIRTHDAY_BONUS: "Birthday bonus",
};

export default function MarketingPage() {
  const token = useAuthStore((s) => s.token);
  const [logs, setLogs] = useState<EmailLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  function reload() {
    if (!token) return;
    fetchEmailLog(token)
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(reload, [token]);

  async function handleRunAbandonedCartCheck() {
    if (!token) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const { remindersSent } = await runAbandonedCartCheck(token);
      setCheckResult(
        remindersSent === 0
          ? "No reminders due right now."
          : `Sent ${remindersSent} abandoned-cart reminder${remindersSent === 1 ? "" : "s"}.`
      );
      reload();
    } catch (err) {
      setCheckResult(err instanceof Error ? err.message : "Failed to run check");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Marketing automation</h1>
          <p className="mt-1 text-sm text-ink-faint">
            No real emails are sent yet — every automated trigger below is logged here instead, standing in until a
            real provider (Resend/SES) is connected.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {checkResult && <p className="text-xs text-ink-faint">{checkResult}</p>}
          <button
            type="button"
            onClick={handleRunAbandonedCartCheck}
            disabled={checking}
            className="rounded-md border border-line bg-paper-raised px-3.5 py-2 text-sm font-medium text-ink transition hover:border-plum disabled:opacity-60"
          >
            {checking ? "Running…" : "Run abandoned-cart check"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">To</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(logs ?? []).map((entry) => (
              <tr key={entry.id} className="transition hover:bg-paper">
                <td className="px-4 py-3 font-medium text-ink">{TYPE_LABEL[entry.type]}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {entry.to}
                  {entry.customer && (
                    <span className="ml-1 text-ink-faint">
                      ({entry.customer.firstName} {entry.customer.lastName})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">{entry.subject}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDateTime(entry.sentAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {logs !== null && logs.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No automated emails sent yet.</p>
        )}
      </div>
    </div>
  );
}
