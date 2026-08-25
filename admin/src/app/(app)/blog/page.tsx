"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import {
  fetchBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  ApiError,
  type AdminBlogPost,
} from "@/lib/api";
import { formatDate } from "@/lib/format";

interface PostDraft {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
}

const EMPTY_DRAFT: PostDraft = { slug: "", title: "", excerpt: "", body: "" };

export default function BlogPage() {
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();
  const [posts, setPosts] = useState<AdminBlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [draft, setDraft] = useState<PostDraft>({ ...EMPTY_DRAFT });
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchBlogPostsAdmin(token)
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [token]);

  function handleTitleChange(title: string) {
    setDraft((d) => ({
      ...d,
      title,
      slug: slugTouched ? d.slug : title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setCreating(true);
    try {
      const created = await createBlogPost(token, draft);
      setPosts((prev) => [created, ...(prev ?? [])]);
      setDraft({ ...EMPTY_DRAFT });
      setSlugTouched(false);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post");
    } finally {
      setCreating(false);
    }
  }

  async function handleTogglePublish(post: AdminBlogPost) {
    if (!token) return;
    setBusyId(post.id);
    setError(null);
    try {
      const updated = await updateBlogPost(token, post.id, {
        status: post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      });
      setPosts((prev) => (prev ?? []).map((p) => (p.id === post.id ? updated : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(post: AdminBlogPost) {
    if (!token) return;
    const ok = await confirm({
      title: `Delete "${post.title}"?`,
      description: "This post will be removed from the journal. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(post.id);
    setError(null);
    try {
      await deleteBlogPost(token, post.id);
      setPosts((prev) => (prev ?? []).filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Blog</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-deep"
        >
          <Plus size={16} />
          New post
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
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Slug</label>
            <input
              required
              value={draft.slug}
              onChange={(e) => {
                setDraft((d) => ({ ...d, slug: e.target.value }));
                setSlugTouched(true);
              }}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Excerpt</label>
            <textarea
              required
              rows={2}
              value={draft.excerpt}
              onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Body</label>
            <textarea
              required
              rows={8}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-faint">Separate paragraphs with a blank line.</p>
          </div>

          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

          <div className="col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
            >
              {creating ? "Saving…" : "Save as draft"}
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
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(posts ?? []).map((post) => (
              <tr key={post.id} className="transition hover:bg-paper">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{post.title}</p>
                  <p className="text-xs text-ink-faint">{post.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{post.author?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleTogglePublish(post)}
                    disabled={busyId === post.id}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
                      post.status === "PUBLISHED" ? "bg-success-bg text-success" : "bg-line text-ink-faint"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={busyId === post.id}
                    className="rounded-md p-1.5 text-ink-faint hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts === null && <p className="px-4 py-8 text-center text-sm text-ink-faint">Loading…</p>}
        {posts !== null && posts.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-faint">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
