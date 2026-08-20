import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminLogin, type AdminRole } from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
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
        const session = await adminLogin(email, password);
        set({ token: session.accessToken, user: session.user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "lbf-admin-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
