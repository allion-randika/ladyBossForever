import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

interface CompareState {
  ids: string[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  pruneToValidProducts: (validIds: Set<string>) => void;
}

// Deliberately local-only, unlike cart/wishlist — comparison is a
// throwaway browsing aid, not account data worth syncing across devices
// or surviving a login merge.
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      toggle: (id) => {
        const ids = get().ids;
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) });
        } else if (ids.length < MAX_COMPARE) {
          set({ ids: [...ids, id] });
        }
      },
      has: (id) => get().ids.includes(id),
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
      pruneToValidProducts: (validIds) => {
        const ids = get().ids;
        const filtered = ids.filter((id) => validIds.has(id));
        if (filtered.length !== ids.length) {
          set({ ids: filtered });
        }
      },
    }),
    {
      name: "lbf-compare",
      partialize: (state) => ({ ids: state.ids }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export { MAX_COMPARE };
