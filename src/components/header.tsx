"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { SearchOverlay } from "@/components/search-overlay";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartHydrated = useCartStore((s) => s.hasHydrated);
  const lines = useCartStore((s) => s.lines);
  const toggleCart = useCartStore((s) => s.toggle);
  const wishlistHydrated = useWishlistStore((s) => s.hasHydrated);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const loadCartFromServer = useCartStore((s) => s.loadFromServer);
  const loadWishlistFromServer = useWishlistStore((s) => s.loadFromServer);
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);

  // Server always renders the logged-out, empty-cart state (no
  // localStorage there). Rendering the real persisted values before each
  // store finishes rehydrating would mismatch the server HTML.
  const isLoggedIn = authHydrated && Boolean(token);
  const wishlistCount = wishlistHydrated ? wishlistIds.length : 0;
  const count = cartHydrated ? cartCount(lines) : 0;

  // A visitor who was already logged in before this page load (not someone
  // who just logged in — that path uploads/merges guest data instead, see
  // session-sync.ts) gets their cart/wishlist from the server, since that's
  // the source of truth for an account. Each store's own idle/loading/ready
  // guard makes this a no-op if a sync already ran this session.
  useEffect(() => {
    if (isLoggedIn) {
      loadCartFromServer();
      loadWishlistFromServer();
    }
  }, [isLoggedIn, loadCartFromServer, loadWishlistFromServer]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <Link href="/" className="font-display text-xl tracking-tight text-plum">
            Lady Boss
          </Link>
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="text-[0.72rem] font-medium uppercase tracking-wider text-ink-soft transition-colors hover:text-plum"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:text-plum sm:flex"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <Link
            href={isLoggedIn ? "/account" : "/account/login"}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:text-plum sm:flex"
            aria-label="Account"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <Link
            href="/wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:text-plum"
            aria-label="Wishlist"
          >
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {wishlistCount > 0 && (
              <CountBubble key={wishlistCount} count={wishlistCount} />
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:text-plum"
            aria-label="Cart"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {count > 0 && <CountBubble key={count} count={count} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper-raised p-6"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="-ml-2 mb-6 flex h-9 w-9 items-center justify-center rounded-full text-ink"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="mb-4 flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-ink-soft transition-colors hover:bg-cream hover:text-plum"
              >
                <Search className="h-4 w-4" strokeWidth={1.75} />
                Search
              </button>
              <nav className="flex flex-col gap-1">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop?category=${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-2 py-2.5 font-display text-lg text-ink transition-colors hover:bg-cream"
                  >
                    {c.label}
                  </Link>
                ))}
              </nav>
              <Link
                href={isLoggedIn ? "/account" : "/account/login"}
                onClick={() => setMenuOpen(false)}
                className="mt-4 flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-ink-soft transition-colors hover:bg-cream hover:text-plum"
              >
                <User className="h-4 w-4" strokeWidth={1.75} />
                {isLoggedIn ? "My account" : "Sign in"}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

function CountBubble({ count }: { count: number }) {
  return (
    <motion.span
      initial={{ scale: 1.5, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-plum px-1 text-[0.6rem] font-semibold tabular-nums text-white"
    >
      {count}
    </motion.span>
  );
}
