"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { createProduct, fetchCategories, ApiError, type Category } from "@/lib/api";

interface VariantDraft {
  size: string;
  color: string;
  colorHex: string;
  stock: string;
}

const EMPTY_VARIANT: VariantDraft = { size: "", color: "", colorHex: "#000000", stock: "0" };

export default function NewProductPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const slug = slugOverride ?? name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([{ ...EMPTY_VARIANT }]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats[0]) setCategoryId(cats[0].id);
      })
      .catch(() => setError("Failed to load categories"));
  }, []);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (variants.length === 0) {
      setError("At least one variant is required.");
      return;
    }

    setSaving(true);
    try {
      const product = await createProduct(token, {
        slug,
        name,
        description,
        details: details
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        categoryId,
        isNew,
        isBestseller,
        isOnSale,
        variants: variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          stock: Number(v.stock),
        })),
      });
      router.replace(`/products/${product.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-ink">New product</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-5">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Slug</label>
            <input
              required
              value={slug}
              onChange={(e) => setSlugOverride(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Details (one per line)</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Price (Rs.)</label>
            <input
              required
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Compare-at price</label>
            <input
              type="number"
              min={0}
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink-soft">Category</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-plum focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex gap-5">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
              New
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} />
              Bestseller
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={isOnSale} onChange={(e) => setIsOnSale(e.target.checked)} />
              On sale
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper-raised p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Variants</h2>
            <button
              type="button"
              onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
              className="flex items-center gap-1 text-sm text-plum hover:text-plum-deep"
            >
              <Plus size={14} />
              Add variant
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs text-ink-faint">Size</label>
                  <input
                    required
                    value={v.size}
                    onChange={(e) => updateVariant(i, { size: e.target.value })}
                    className="w-20 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-faint">Color</label>
                  <input
                    required
                    value={v.color}
                    onChange={(e) => updateVariant(i, { color: e.target.value })}
                    className="w-28 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-faint">Hex</label>
                  <input
                    required
                    type="color"
                    value={v.colorHex}
                    onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                    className="h-[34px] w-14 rounded-md border border-line"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-faint">Stock</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => updateVariant(i, { stock: e.target.value })}
                    className="w-24 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
                  />
                </div>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="mb-1.5 rounded-md p-1.5 text-ink-faint hover:bg-danger-bg hover:text-danger"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create product"}
        </button>
      </form>
    </div>
  );
}
