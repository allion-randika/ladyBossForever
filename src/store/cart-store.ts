import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { addCartLine, clearServerCart, fetchCart, removeCartLine, setCartLineQty, syncCart } from "@/lib/api";

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  lastAdded: string | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  serverStatus: "idle" | "loading" | "ready";
  addItem: (productId: string, size: string, color: string, qty?: number) => void;
  removeLine: (productId: string, size: string, color: string) => void;
  setQty: (productId: string, size: string, color: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  pruneToValidProducts: (validIds: Set<string>) => void;
  /** Call once, on app boot, whenever an already-logged-in session is
   * detected. Server is the source of truth for logged-in customers, so
   * this overwrites local state — it never re-uploads local data. */
  loadFromServer: () => Promise<void>;
  /** Call once, right after a successful login/register. Uploads whatever
   * was in the local (guest) cart so it isn't lost, merges (by adding
   * quantities) with whatever the account already had server-side, and
   * adopts the result. */
  syncGuestToServer: () => Promise<void>;
  /** Call on logout — the next guest on this browser shouldn't inherit the
   * previous customer's bag. */
  clearLocal: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      lastAdded: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      serverStatus: "idle",
      addItem: (productId, size, color, qty = 1) => {
        const lines = get().lines;
        const existing = lines.find(
          (l) => l.productId === productId && l.size === size && l.color === color
        );
        if (existing) {
          set({
            lines: lines.map((l) =>
              l === existing ? { ...l, qty: l.qty + qty } : l
            ),
            lastAdded: productId,
            isOpen: true,
          });
        } else {
          set({
            lines: [...lines, { productId, size, color, qty }],
            lastAdded: productId,
            isOpen: true,
          });
        }

        const token = useAuthStore.getState().token;
        if (token) {
          // Server increments by whatever qty is sent, matching this
          // action's own semantics — not a full resync of the line.
          addCartLine(token, { productId, size, color, qty }).catch(() => {});
        }
      },
      removeLine: (productId, size, color) => {
        set({
          lines: get().lines.filter(
            (l) => !(l.productId === productId && l.size === size && l.color === color)
          ),
        });
        const token = useAuthStore.getState().token;
        if (token) {
          removeCartLine(token, { productId, size, color }).catch(() => {});
        }
      },
      setQty: (productId, size, color, qty) => {
        const nextQty = Math.max(1, qty);
        set({
          lines: get().lines.map((l) =>
            l.productId === productId && l.size === size && l.color === color
              ? { ...l, qty: nextQty }
              : l
          ),
        });
        const token = useAuthStore.getState().token;
        if (token) {
          setCartLineQty(token, { productId, size, color, qty: nextQty }).catch(() => {});
        }
      },
      clear: () => {
        set({ lines: [] });
        const token = useAuthStore.getState().token;
        if (token) {
          clearServerCart(token).catch(() => {});
        }
      },
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      pruneToValidProducts: (validIds) => {
        const lines = get().lines;
        const filtered = lines.filter((l) => validIds.has(l.productId));
        if (filtered.length !== lines.length) {
          set({ lines: filtered });
        }
      },
      loadFromServer: async () => {
        const token = useAuthStore.getState().token;
        if (!token || get().serverStatus !== "idle") return;
        set({ serverStatus: "loading" });
        try {
          const lines = await fetchCart(token);
          set({ lines, serverStatus: "ready" });
        } catch {
          set({ serverStatus: "ready" });
        }
      },
      syncGuestToServer: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const merged = await syncCart(token, get().lines);
          set({ lines: merged, serverStatus: "ready" });
        } catch {
          // leave local (guest) cart as-is if the upload failed
        }
      },
      clearLocal: () => set({ lines: [], serverStatus: "idle" }),
    }),
    {
      name: "lbf-cart",
      // Only the actual cart data should survive a reload — `isOpen` and
      // `lastAdded` are transient UI state, and `hasHydrated` must always
      // start false in-memory (see below) or this guard can't do its job.
      partialize: (state) => ({ lines: state.lines }),
      // Same reasoning as wishlist-store: the server always renders an
      // empty cart, so anything derived from `lines` (count badges,
      // subtotal) must not render the real persisted value until this
      // flips true, or the client's first paint mismatches the server HTML.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[], products: Product[]): number {
  return lines.reduce((sum, l) => {
    const product = products.find((p) => p.id === l.productId);
    return sum + (product ? product.price * l.qty : 0);
  }, 0);
}
