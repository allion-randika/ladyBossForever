import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/store/auth-store";
import { fetchWishlist, addWishlistItem, removeWishlistItem, syncWishlist } from "@/lib/api";

interface WishlistState {
  ids: string[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  serverStatus: "idle" | "loading" | "ready";
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  pruneToValidProducts: (validIds: Set<string>) => void;
  /** Call once, on app boot, whenever an already-logged-in session is
   * detected. Server is the source of truth for logged-in customers, so
   * this overwrites local state — it never re-uploads local data. */
  loadFromServer: () => Promise<void>;
  /** Call once, right after a successful login/register. Uploads whatever
   * was in the local (guest) wishlist so it isn't lost, merges it with
   * whatever the account already had server-side, and adopts the result. */
  syncGuestToServer: () => Promise<void>;
  /** Call on logout — the next guest on this browser shouldn't inherit the
   * previous customer's wishlist. */
  clearLocal: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      serverStatus: "idle",
      toggle: (id) => {
        const ids = get().ids;
        const wasWishlisted = ids.includes(id);
        const next = wasWishlisted ? ids.filter((x) => x !== id) : [...ids, id];
        set({ ids: next });

        const token = useAuthStore.getState().token;
        if (!token) return; // guest — localStorage is the only copy
        const request = wasWishlisted ? removeWishlistItem(token, id) : addWishlistItem(token, id);
        request.catch(() => set({ ids })); // revert local change if the server call failed
      },
      has: (id) => get().ids.includes(id),
      pruneToValidProducts: (validIds) => {
        const ids = get().ids;
        const filtered = ids.filter((id) => validIds.has(id));
        if (filtered.length !== ids.length) {
          set({ ids: filtered });
        }
      },
      loadFromServer: async () => {
        const token = useAuthStore.getState().token;
        if (!token || get().serverStatus !== "idle") return;
        set({ serverStatus: "loading" });
        try {
          const ids = await fetchWishlist(token);
          set({ ids, serverStatus: "ready" });
        } catch {
          set({ serverStatus: "ready" });
        }
      },
      syncGuestToServer: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const merged = await syncWishlist(token, get().ids);
          set({ ids: merged, serverStatus: "ready" });
        } catch {
          // leave local (guest) wishlist as-is if the upload failed
        }
      },
      clearLocal: () => set({ ids: [], serverStatus: "idle" }),
    }),
    {
      name: "lbf-wishlist",
      partialize: (state) => ({ ids: state.ids }),
      // Server always renders an empty wishlist (no localStorage). If the
      // real persisted list isn't empty, the client's first render would
      // otherwise diverge from the server HTML — a hydration mismatch, not
      // just a redirect bug. Consumers gate on hasHydrated the same way
      // auth-store's guards do.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
