import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, register as apiRegister } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: { id: string; email: string } | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      login: async (email, password) => {
        const session = await apiLogin(email, password);
        set({ token: session.accessToken, user: session.user });
      },
      register: async (input) => {
        const session = await apiRegister(input);
        set({ token: session.accessToken, user: session.user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "lbf-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      // Persisted `token`/`user` aren't available until this rehydration
      // finishes (it's async, after first paint). Guards on /account and
      // /checkout must wait for hasHydrated before deciding to redirect —
      // otherwise every hard page load bounces a logged-in visitor to
      // /login during the split-second gap before localStorage loads.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
