"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { fetchAuditLog, type AuditLogEntry } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function AuditLogPage() {
  const token = useAuthStore((s) => s.token);
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchAuditLog(token)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Audit log</h1>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{formatDateTime(e.createdAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{e.admin.name}</td>
                <td className="px-4 py-3 font-medium text-ink">{e.action}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {e.targetType} · {e.targetId.slice(0, 10)}…
                </td>
                <td className="px-4 py-3 text-xs text-ink-faint">
                  {e.metadata ? JSON.stringify(e.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && entries.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}
