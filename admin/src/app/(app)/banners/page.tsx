"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import {
  fetchBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  ApiError,
  type AdminBanner,
} from "@/lib/api";

interface BannerDraft {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  position: string;
}

const EMPTY_DRAFT: BannerDraft = { title: "", subtitle: "", ctaLabel: "", ctaHref: "/shop", position: "0" };

export default function BannersPage() {
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();
  const [banners, setBanners] = useState<AdminBanner[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<BannerDraft>({ ...EMPTY_DRAFT });
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchBannersAdmin(token)
      .then(setBanners)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setCreating(true);
    try {
      const created = await createBanner(token, {
        title: draft.title,
        subtitle: draft.subtitle || undefined,
        ctaLabel: draft.ctaLabel,
        ctaHref: draft.ctaHref,
        position: Number(draft.position),
      });
      setBanners((prev) => [...(prev ?? []), created].sort((a, b) => a.position - b.position));
      setDraft({ ...EMPTY_DRAFT });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create banner");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(banner: AdminBanner) {
    if (!token) return;
    setBusyId(banner.id);
    setError(null);
    try {
      const updated = await updateBanner(token, banner.id, { isActive: !banner.isActive });
      setBanners((prev) => (prev ?? []).map((b) => (b.id === banner.id ? updated : b)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(banner: AdminBanner) {
    if (!token) return;
    const ok = await confirm({
      title: `Delete "${banner.title}"?`,
      description: "This banner will no longer appear on the homepage. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(banner.id);
    setError(null);
    try {
      await deleteBanner(token, banner.id);
      setBanners((prev) => (prev ?? []).filter((b) => b.id !== banner.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Homepage banners</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-deep"
        >
          <Plus size={16} />
          New banner
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-5"
        >
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Title</label>
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Subtitle (optional)</label>
            <input
              value={draft.subtitle}
              onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Button label</label>
            <input
              required
              value={draft.ctaLabel}
              onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Button link</label>
            <input
              required
              value={draft.ctaHref}
              onChange={(e) => setDraft((d) => ({ ...d, ctaHref: e.target.value }))}
              placeholder="/shop"
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Position</label>
            <input
              type="number"
              value={draft.position}
              onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-faint">Lower numbers show first.</p>
          </div>

          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create banner"}
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Button</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(banners ?? []).map((banner) => (
              <tr key={banner.id} className="transition hover:bg-paper">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{banner.title}</p>
                  {banner.subtitle && <p className="text-xs text-ink-faint">{banner.subtitle}</p>}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {banner.ctaLabel} <span className="text-ink-faint">→ {banner.ctaHref}</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">{banner.position}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    disabled={busyId === banner.id}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
                      banner.isActive ? "bg-success-bg text-success" : "bg-line text-ink-faint"
                    }`}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(banner)}
                    disabled={busyId === banner.id}
                    className="rounded-md p-1.5 text-ink-faint hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {banners === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {banners !== null && banners.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No banners yet.</p>
        )}
      </div>
    </div>
  );
}
