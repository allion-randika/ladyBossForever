"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { confirmOrderPayment, type OrderSummary } from "@/lib/api";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const guestToken = searchParams.get("guestToken") ?? undefined;
  const provider = searchParams.get("provider") ?? "your payment provider";
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const clearCart = useCartStore((s) => s.clear);

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const hasCredentials = Boolean(token) || Boolean(guestToken);
  const missingParamsError =
    hasHydrated && (!orderId || !hasCredentials) ? "Missing order — start checkout again from your bag." : null;

  useEffect(() => {
    if (!hasHydrated || !orderId || !hasCredentials) return;
    const id = window.setTimeout(() => {
      confirmOrderPayment(orderId, { token: token ?? undefined, guestToken })
        .then((confirmed) => {
          setOrder(confirmed);
          clearCart();
        })
        .catch((err: unknown) => setConfirmError(err instanceof Error ? err.message : "Payment confirmation failed"));
    }, 1400);
    return () => window.clearTimeout(id);
  }, [hasHydrated, orderId, hasCredentials, token, guestToken, clearCart]);

  const error = missingParamsError ?? confirmError;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      {error ? (
        <>
          <p className="text-rose">{error}</p>
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            Back to shop
          </Link>
        </>
      ) : !order ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-plum" strokeWidth={1.75} />
          <p className="mt-4 text-ink-soft">Redirecting to {provider} to complete your payment&hellip;</p>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15"
          >
            <Check className="h-7 w-7 text-success" strokeWidth={2.5} />
          </motion.div>
          <h1 className="mt-6 font-display text-2xl text-ink">Order confirmed</h1>
          <p className="mt-2 text-ink-soft">
            Order <strong className="text-ink">#{order.number}</strong> is on its way. We&rsquo;ve emailed a
            confirmation.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            {token && (
              <Link
                href="/account"
                className="rounded-full border border-line-strong px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-plum hover:text-plum"
              >
                View orders
              </Link>
            )}
            <Link
              href="/shop"
              className="rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
            >
              Keep shopping
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function CheckoutConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
