"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useConfirm } from "@/components/confirm-dialog";
import {
  fetchAdminProduct,
  fetchCategories,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  removeVariant,
  ApiError,
  type AdminProduct,
  type Category,
} from "@/lib/api";
import { formatLKR } from "@/lib/format";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const confirm = useConfirm();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);

  const [newVariant, setNewVariant] = useState({ size: "", color: "", colorHex: "#000000", stock: "0", costPrice: "" });

  const load = useCallback(() => {
    if (!id) return;
    fetchAdminProduct(id)
      .then((p) => {
        if (!p) {
          setError("Product not found");
          return;
        }
        setProduct(p);
        setName(p.name);
        setDescription(p.description);
        setDetails(p.details.join("\n"));
        setPrice(String(p.price));
        setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : "");
        setCategoryId(p.categoryId);
        setIsNew(p.isNew);
        setIsBestseller(p.isBestseller);
        setIsOnSale(p.isOnSale);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    fetchCategories().then(setCategories).catch(() => {});
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !product) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateProduct(token, product.id, {
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
      });
      setProduct(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    if (!token || !product) return;
    const ok = await confirm({
      title: `Delete "${product.name}"?`,
      description: "This removes the product and its variants. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProduct(token, product.id);
      router.replace("/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !product) return;
    setError(null);
    try {
      const updated = await addVariant(token, product.id, {
        size: newVariant.size,
        color: newVariant.color,
        colorHex: newVariant.colorHex,
        stock: Number(newVariant.stock),
        costPrice: newVariant.costPrice ? Number(newVariant.costPrice) : undefined,
      });
      setProduct(updated);
      setNewVariant({ size: "", color: "", colorHex: "#000000", stock: "0", costPrice: "" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add variant");
    }
  }

  async function handleStockChange(variantId: string, stock: number) {
    if (!token || !product) return;
    try {
      const updated = await updateVariant(token, product.id, variantId, { stock });
      setProduct(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update stock");
    }
  }

  async function handleCostChange(variantId: string, costPrice: number) {
    if (!token || !product) return;
    try {
      const updated = await updateVariant(token, product.id, variantId, { costPrice });
      setProduct(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update cost price");
    }
  }

  async function handleRemoveVariant(variantId: string) {
    if (!token || !product) return;
    const ok = await confirm({
      title: "Remove this variant?",
      description: "This size/colour combination will no longer be available to purchase.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await removeVariant(token, product.id, variantId);
      setProduct(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove variant");
    }
  }

  if (loading) return <p className="text-sm text-ink-faint">Loading…</p>;
  if (!product) return <p className="text-sm text-danger">{error ?? "Product not found"}</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{product.name}</h1>
        <button onClick={handleDeleteProduct} className="text-sm text-danger hover:underline">
          Delete product
        </button>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-5">
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

        {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

        <div className="col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-plum px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-deep disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-lg border border-line bg-paper-raised p-5">
        <h2 className="text-sm font-medium text-ink">Variants</h2>

        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wide text-ink-faint uppercase">
              <th className="py-2 font-medium">Size</th>
              <th className="py-2 font-medium">Color</th>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Reserved</th>
              <th className="py-2 font-medium">Cost price</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {product.variants.map((v) => (
              <tr key={v.id}>
                <td className="py-2">{v.size}</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-line"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    {v.color}
                  </span>
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={0}
                    defaultValue={v.stock}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== v.stock) handleStockChange(v.id, val);
                    }}
                    className="w-20 rounded-md border border-line px-2 py-1 text-sm focus:border-plum focus:outline-none"
                  />
                </td>
                <td className="py-2 tabular-nums text-ink-faint">{v.reservedStock}</td>
                <td className="py-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Not set"
                    defaultValue={v.costPrice ?? ""}
                    onBlur={(e) => {
                      const val = e.target.value === "" ? null : Number(e.target.value);
                      if (val !== null && val !== v.costPrice) handleCostChange(v.id, val);
                    }}
                    className="w-24 rounded-md border border-line px-2 py-1 text-sm focus:border-plum focus:outline-none"
                  />
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => handleRemoveVariant(v.id)}
                    className="rounded-md p-1.5 text-ink-faint hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={handleAddVariant} className="mt-4 flex items-end gap-2 border-t border-line pt-4">
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Size</label>
            <input
              required
              value={newVariant.size}
              onChange={(e) => setNewVariant((v) => ({ ...v, size: e.target.value }))}
              className="w-20 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Color</label>
            <input
              required
              value={newVariant.color}
              onChange={(e) => setNewVariant((v) => ({ ...v, color: e.target.value }))}
              className="w-28 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Hex</label>
            <input
              required
              type="color"
              value={newVariant.colorHex}
              onChange={(e) => setNewVariant((v) => ({ ...v, colorHex: e.target.value }))}
              className="h-[34px] w-14 rounded-md border border-line"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Stock</label>
            <input
              required
              type="number"
              min={0}
              value={newVariant.stock}
              onChange={(e) => setNewVariant((v) => ({ ...v, stock: e.target.value }))}
              className="w-24 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-faint">Cost price</label>
            <input
              type="number"
              min={0}
              placeholder="Optional"
              value={newVariant.costPrice}
              onChange={(e) => setNewVariant((v) => ({ ...v, costPrice: e.target.value }))}
              className="w-24 rounded-md border border-line px-2 py-1.5 text-sm focus:border-plum focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-plum hover:text-plum"
          >
            <Plus size={14} />
            Add variant
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs text-ink-faint">Product price: {formatLKR(product.price)}</p>
    </div>
  );
}
