"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, ScrollText, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import type { AdminRole } from "@/lib/api";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; roles?: AdminRole[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/promotions", label: "Promotions", icon: Tag, roles: ["MARKETING_MANAGER"] },
  // Empty roles list — visible to SUPER_ADMIN only, via the bypass below.
  { href: "/audit-log", label: "Audit log", icon: ScrollText, roles: [] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (hasHydrated && !token) router.replace("/login");
  }, [hasHydrated, token, router]);

  if (!hasHydrated || !token) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-ink">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs tracking-[0.2em] text-sidebar-ink-soft uppercase">Lady Boss Forever</p>
          <p className="mt-0.5 text-sm font-medium">Admin console</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.filter((item) => {
            if (!item.roles) return true;
            if (!user) return false;
            return user.role === "SUPER_ADMIN" || item.roles.includes(user.role);
          }).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-sidebar-ink-soft hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm text-white">{user?.name}</p>
          <p className="truncate text-xs text-sidebar-ink-soft">{user?.role.replace(/_/g, " ")}</p>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="mt-3 flex items-center gap-1.5 text-xs text-sidebar-ink-soft transition hover:text-white"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
