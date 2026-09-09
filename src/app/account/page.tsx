"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  fetchMyOrders,
  fetchMyGiftCards,
  fetchMyProfile,
  updateMyProfile,
  fetchMyStoreCredit,
  fetchMyReturnRequests,
  type OrderSummary,
  type GiftCard,
  type CustomerProfile,
  type StoreCreditSummary,
  type ReturnRequestSummary,
} from "@/lib/api";
import { clearGuestVisibleData } from "@/lib/session-sync";
import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ReturnRequestPanel } from "@/components/return-request-panel";

const RETURN_ELIGIBLE_STATUSES: OrderSummary["status"][] = ["PAID", "FULFILLED"];

const STATUS_LABEL: Record<OrderSummary["status"], string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_TONE: Record<OrderSummary["status"], string> = {
  PENDING: "text-gold",
  PAID: "text-success",
  FULFILLED: "text-success",
  CANCELLED: "text-ink-faint",
  REFUNDED: "text-ink-faint",
};

export default function AccountPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const logout = useAuthStore((s) => s.logout);

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [giftCards, setGiftCards] = useState<GiftCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [storeCredit, setStoreCredit] = useState<StoreCreditSummary | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequestSummary[]>([]);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [birthdaySaved, setBirthdaySaved] = useState(false);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/account/login?redirect=%2Faccount");
      return;
    }
    fetchMyOrders(token)
      .then(setOrders)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load orders"));
    fetchMyGiftCards(token)
      .then(setGiftCards)
      .catch(() => setGiftCards([]));
    fetchMyProfile(token)
      .then((p) => {
        setProfile(p);
        setBirthdayInput(p.birthday ? p.birthday.slice(0, 10) : "");
      })
      .catch(() => setProfile(null));
    fetchMyStoreCredit(token)
      .then(setStoreCredit)
      .catch(() => setStoreCredit(null));
    fetchMyReturnRequests(token)
      .then(setReturnRequests)
      .catch(() => setReturnRequests([]));
  }, [hasHydrated, token, router]);

  async function handleSaveBirthday(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !birthdayInput) return;
    setBirthdayError(null);
    setBirthdaySaved(false);
    setSavingBirthday(true);
    try {
      const updated = await updateMyProfile(token, { birthday: birthdayInput });
      setProfile(updated);
      setBirthdaySaved(true);
    } catch (err) {
      setBirthdayError(err instanceof Error ? err.message : "Couldn't save your birthday");
    } finally {
      setSavingBirthday(false);
    }
  }

  if (!hasHydrated || !token) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose">Account</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{user?.email}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            clearGuestVisibleData();
            router.push("/");
          }}
          className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition-colors hover:border-plum hover:text-plum"
        >
          Sign out
        </button>
      </div>

      <div className="mt-10 rounded-2xl border border-line p-5">
        <h2 className="font-display text-xl text-ink">Birthday</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Add your birthday and we&rsquo;ll drop a store credit surprise into your account on the day.
        </p>
        <form onSubmit={handleSaveBirthday} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={birthdayInput}
            onChange={(e) => {
              setBirthdayInput(e.target.value);
              setBirthdaySaved(false);
            }}
            className="rounded-lg border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:border-plum focus:outline-none"
          />
          <button
            type="submit"
            disabled={savingBirthday || !birthdayInput}
            className="rounded-full bg-plum px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep disabled:opacity-60"
          >
            {savingBirthday ? "Saving…" : "Save"}
          </button>
          {birthdaySaved && <span className="text-xs font-medium text-success">Saved</span>}
        </form>
        {birthdayError && <p className="mt-2 text-xs text-rose">{birthdayError}</p>}
      </div>

      <div className="mt-8 rounded-2xl border border-line p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl text-ink">Store credit</h2>
          <p className="text-lg font-medium tabular-nums text-ink">
            {formatLKR(storeCredit?.balance ?? profile?.storeCreditBalance ?? 0)}
          </p>
        </div>
        {storeCredit && storeCredit.transactions.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {storeCredit.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-soft">
                  {tx.reason}
                  {tx.order && <span className="text-ink-faint"> &middot; Order #{tx.order.number}</span>}
                </span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    tx.amount >= 0 ? "text-success" : "text-ink-faint"
                  )}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatLKR(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {storeCredit && storeCredit.transactions.length === 0 && (
          <p className="mt-4 text-sm text-ink-faint">No store credit activity yet.</p>
        )}
      </div>

      <h2 className="mt-10 mb-4 font-display text-xl text-ink">Order history</h2>

      {error && <p className="text-sm text-rose">{error}</p>}

      {!error && orders === null && <p className="text-ink-soft">Loading orders&hellip;</p>}

      {orders?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line py-16 text-center">
          <p className="text-ink-soft">No orders yet.</p>
          <Link
            href="/shop"
            className="rounded-full bg-plum px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
          >
            Start shopping
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-ink">Order #{order.number}</p>
                <span className={cn("text-xs font-semibold uppercase tracking-wider", STATUS_TONE[order.status])}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {new Date(order.createdAt).toLocaleDateString("en-LK", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {order.items.map((item) => (
                  <li key={item.id} className="text-sm text-ink-soft">
                    {item.qty} &times; {item.product.name} ({item.variant.color}, {item.variant.size})
                    {token && (
                      <ReturnRequestPanel
                        token={token}
                        item={item}
                        eligible={RETURN_ELIGIBLE_STATUSES.includes(order.status)}
                        existingRequests={returnRequests.filter((r) => r.orderItemId === item.id)}
                        onRequested={(r) => setReturnRequests((prev) => [r, ...prev])}
                      />
                    )}
                  </li>
                ))}
              </ul>
              {order.discount && (
                <p className="mt-3 text-xs text-success">
                  {order.discount.code} applied &mdash; &minus;{formatLKR(order.discountAmount)}
                </p>
              )}
              {order.giftCard && (
                <p className={cn("text-xs text-success", order.discount ? "mt-1" : "mt-3")}>
                  {order.giftCard.code} applied &mdash; &minus;{formatLKR(order.giftCardAmount)}
                </p>
              )}
              {order.storeCreditAmount > 0 && (
                <p className={cn("text-xs text-success", order.discount || order.giftCard ? "mt-1" : "mt-3")}>
                  Store credit applied &mdash; &minus;{formatLKR(order.storeCreditAmount)}
                </p>
              )}
              <p
                className={cn(
                  "text-sm font-medium tabular-nums text-ink",
                  order.discount || order.giftCard || order.storeCreditAmount > 0 ? "mt-1" : "mt-3"
                )}
              >
                Total {formatLKR(order.total)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl text-ink">Gift cards</h2>
        <Link href="/gift-cards" className="text-xs font-medium text-plum underline underline-offset-4">
          Buy a gift card
        </Link>
      </div>

      {giftCards === null && <p className="mt-4 text-ink-soft">Loading&hellip;</p>}

      {giftCards?.length === 0 && <p className="mt-4 text-sm text-ink-faint">You haven&rsquo;t bought any gift cards yet.</p>}

      {giftCards && giftCards.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {giftCards.map((card) => (
            <li key={card.id} className="flex items-center justify-between rounded-2xl border border-line p-4">
              <div>
                <p className="font-mono text-sm text-ink">{card.code}</p>
                <p className="text-xs text-ink-faint">For {card.recipientName || card.recipientEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums text-ink">{formatLKR(card.balance)}</p>
                <p className="text-xs text-ink-faint">of {formatLKR(card.initialBalance)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
