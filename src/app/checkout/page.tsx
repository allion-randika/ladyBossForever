"use client";

import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore, cartSubtotal } from "@/store/cart-store";
import { useProductCacheStore } from "@/store/product-cache-store";
import { createOrder, createGuestOrder, type PaymentMethod } from "@/lib/api";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/cn";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; blurb: string }[] = [
  { value: "CARD_PAYHERE", label: "Card (PayHere)", blurb: "Visa, Mastercard, Amex" },
  { value: "PAYZY", label: "Payzy", blurb: "3 or 4 installments" },
  { value: "MINTPAY", label: "Mintpay", blurb: "3 or 4 installments" },
  { value: "KOKO", label: "Koko", blurb: "3 installments" },
];

export default function CheckoutPage() {
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accountEmail = useAuthStore((s) => s.user?.email);
  const lines = useCartStore((s) => s.lines);
  const products = useProductCacheStore((s) => s.products);
  const ensureLoaded = useProductCacheStore((s) => s.ensureLoaded);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const isLoggedIn = hasHydrated && Boolean(token);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD_PAYHERE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cartItems = lines
    .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
    .filter(
      (entry): entry is { line: (typeof lines)[number]; product: NonNullable<(typeof entry)["product"]> } =>
        Boolean(entry.product)
    );
  const subtotal = cartSubtotal(lines, products);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const items: { productId: string; variantId: string; qty: number }[] = [];
      for (const { line, product } of cartItems) {
        const variant = product.variants.find((v) => v.size === line.size && v.color === line.color);
        if (!variant) {
          throw new Error(`${product.name} (${line.color}, ${line.size}) is no longer available.`);
        }
        items.push({ productId: product.id, variantId: variant.id, qty: line.qty });
      }

      const shippingAddress = {
        line1,
        line2: line2 || undefined,
        city,
        postalCode: postalCode || undefined,
        phone,
      };

      const { payment } =
        isLoggedIn && token
          ? await createOrder(token, { items, shippingAddress, paymentMethod })
          : await createGuestOrder({ items, shippingAddress, paymentMethod, email, firstName, lastName });

      window.location.href = payment.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong placing your order");
      setSubmitting(false);
    }
  }

  if (!hasHydrated) return null;

  if (lines.length > 0 && cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-ink-soft">Loading your bag&hellip;</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-ink-soft">Your bag is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose">Checkout</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Complete your order</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-8">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl text-ink">Contact</h2>
              {!isLoggedIn && (
                <Link
                  href="/account/login?redirect=%2Fcheckout"
                  className="text-xs font-medium text-plum underline underline-offset-4"
                >
                  Sign in instead
                </Link>
              )}
            </div>
            {isLoggedIn ? (
              <p className="text-sm text-ink-soft">{accountEmail}</p>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
                  />
                </div>
                <p className="text-xs text-ink-faint">
                  Checking out as a guest &mdash; no account needed. Order confirmation goes to this email.
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Shipping address</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                required
                placeholder="Address line 1"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
              />
              <input
                type="text"
                placeholder="Address line 2 (optional)"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Postal code (optional)"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
                />
              </div>
              <input
                type="tel"
                required
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Payment</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  aria-pressed={paymentMethod === opt.value}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition-colors",
                    paymentMethod === opt.value
                      ? "border-plum bg-cream"
                      : "border-line-strong hover:border-plum"
                  )}
                >
                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{opt.blurb}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              Demo checkout &mdash; you&rsquo;ll be sent through a simulated payment step; no real charge is made.
            </p>
          </section>

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-rose">
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-plum py-3.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Place order — ${formatLKR(subtotal)}`}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-line p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Order summary</h2>
          <ul className="flex flex-col gap-3">
            {cartItems.map(({ line, product }) => (
              <li key={`${line.productId}-${line.size}-${line.color}`} className="flex justify-between gap-2 text-sm">
                <span className="text-ink-soft">
                  {line.qty} &times; {product.name}
                  <span className="block text-xs text-ink-faint">
                    {line.color} &middot; {line.size}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-ink">{formatLKR(product.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-medium">
            <span className="text-ink-soft">Subtotal</span>
            <span className="tabular-nums text-ink">{formatLKR(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
