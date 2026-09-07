"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  fetchAccountsSummary,
  fetchProfitability,
  runBirthdayCheck,
  type AccountsSummary,
  type ProductProfit,
} from "@/lib/api";
import { formatLKR } from "@/lib/format";

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="rounded-lg border border-line bg-paper-raised p-5">
      <p className="text-xs tracking-wide text-ink-faint uppercase">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AccountsPage() {
  const token = useAuthStore((s) => s.token);
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [profitability, setProfitability] = useState<ProductProfit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [checkingBirthdays, setCheckingBirthdays] = useState(false);
  const [birthdayResult, setBirthdayResult] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAccountsSummary(token)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    fetchProfitability(token)
      .then(setProfitability)
      .catch(() => {});
  }, [token]);

  async function handleRunBirthdayCheck() {
    if (!token) return;
    setCheckingBirthdays(true);
    setBirthdayResult(null);
    try {
      const { rewarded } = await runBirthdayCheck(token);
      setBirthdayResult(
        rewarded === 0
          ? "No birthdays today."
          : `Rewarded ${rewarded} customer${rewarded === 1 ? "" : "s"} with a birthday bonus.`
      );
    } catch (err) {
      setBirthdayResult(err instanceof Error ? err.message : "Failed to run birthday check");
    } finally {
      setCheckingBirthdays(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-ink">Accounts</h1>
        <div className="flex items-center gap-3">
          {birthdayResult && <p className="text-xs text-ink-faint">{birthdayResult}</p>}
          <button
            type="button"
            onClick={handleRunBirthdayCheck}
            disabled={checkingBirthdays}
            className="rounded-md border border-line bg-paper-raised px-3.5 py-2 text-sm font-medium text-ink transition hover:border-plum disabled:opacity-60"
          >
            {checkingBirthdays ? "Running…" : "Run birthday check"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {summary && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Revenue" value={formatLKR(summary.totalRevenue)} />
            <StatCard label="Cost of goods" value={formatLKR(summary.totalCOGS)} />
            <StatCard label="Expenses" value={formatLKR(summary.totalExpenses)} />
            <StatCard label="Gross profit" value={formatLKR(summary.grossProfit)} tone="success" />
            <StatCard
              label="Net profit"
              value={formatLKR(summary.netProfit)}
              tone={summary.netProfit >= 0 ? "success" : "danger"}
            />
          </div>
          {summary.unitsMissingCost > 0 && (
            <p className="mt-3 text-xs text-warning">
              {summary.unitsMissingCost} sold unit{summary.unitsMissingCost === 1 ? "" : "s"} have no cost price set
              — cost of goods and profit figures above don&rsquo;t yet account for them. Set cost prices on product
              variants to complete the picture.
            </p>
          )}
        </>
      )}

      <h2 className="mt-8 text-sm font-medium text-ink">Profitability by product</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Units sold</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Profit</th>
              <th className="px-4 py-3 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(profitability ?? []).map((p) => (
              <tr key={p.id} className="transition hover:bg-paper">
                <td className="px-4 py-3 font-medium text-ink">
                  {p.name}
                  {p.unitsMissingCost > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-warning">
                      ({p.unitsMissingCost} unit{p.unitsMissingCost === 1 ? "" : "s"} missing cost)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{p.unitsSold}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{formatLKR(p.revenue)}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{formatLKR(p.cost)}</td>
                <td className={`px-4 py-3 tabular-nums font-medium ${p.profit >= 0 ? "text-success" : "text-danger"}`}>
                  {formatLKR(p.profit)}
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{(p.margin * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {profitability === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {profitability !== null && profitability.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No sales yet.</p>
        )}
      </div>
    </div>
  );
}
