import type { Badge, Category, Product } from "./types";
import { artForProduct } from "./art-palette";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface ApiVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
}

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string[];
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  isBestseller: boolean;
  isOnSale: boolean;
  category: { slug: string; label: string };
  variants: ApiVariant[];
}

function mapApiProduct(p: ApiProduct): Product {
  const colorMap = new Map<string, { name: string; hex: string }>();
  const sizes: string[] = [];
  for (const v of p.variants) {
    if (!colorMap.has(v.color)) colorMap.set(v.color, { name: v.color, hex: v.colorHex });
    if (!sizes.includes(v.size)) sizes.push(v.size);
  }

  const badges: Badge[] = [];
  if (p.isNew) badges.push("New");
  if (p.isBestseller) badges.push("Bestseller");
  if (p.isOnSale) badges.push("Sale");

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.slug as Category,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    colors: Array.from(colorMap.values()),
    sizes,
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, color: v.color })),
    badges,
    description: p.description,
    details: p.details,
    art: artForProduct(p.id),
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API request to ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProducts(filters?: {
  category?: string;
  size?: string;
  color?: string;
  q?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.size) params.set("size", filters.size);
  if (filters?.color) params.set("color", filters.color);
  if (filters?.q) params.set("q", filters.q);
  const qs = params.toString();

  const data = await apiFetch<ApiProduct[]>(`/products${qs ? `?${qs}` : ""}`);
  return data.map(mapApiProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const data = await apiFetch<ApiProduct>(`/products/${slug}`);
    return mapApiProduct(data);
  } catch {
    return null;
  }
}

// ---------- Auth ----------

export interface AuthSession {
  accessToken: string;
  user: { id: string; email: string };
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as { message?: string } | null;
  if (!res.ok) {
    throw new Error(data?.message ?? `Request to ${path} failed with ${res.status}`);
  }
  return data as T;
}

export function login(email: string, password: string): Promise<AuthSession> {
  return postJson<AuthSession>("/auth/login", { email, password });
}

export function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthSession> {
  return postJson<AuthSession>("/auth/register", input);
}

// ---------- Orders ----------

export interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  phone: string;
}

export type PaymentMethod = "CARD_PAYHERE" | "PAYZY" | "MINTPAY" | "KOKO";

export interface CreateOrderInput {
  items: { productId: string; variantId: string; qty: number }[];
  shippingAddress: ShippingAddressInput;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  giftCardCode?: string;
  storeCreditAmount?: number;
}

export interface OrderItemSummary {
  qty: number;
  unitPrice: number;
  product: { name: string; slug: string };
  variant: { size: string; color: string };
}

export interface OrderSummary {
  id: string;
  number: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmount: number;
  giftCardAmount: number;
  storeCreditAmount: number;
  total: number;
  createdAt: string;
  items: OrderItemSummary[];
  discount: { code: string; type: "PERCENTAGE" | "FIXED"; value: number } | null;
  giftCard: { code: string } | null;
}

export interface DiscountPreview {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  discountAmount: number;
  total: number;
}

export function validateDiscountCode(code: string, subtotal: number): Promise<DiscountPreview> {
  return postJson<DiscountPreview>("/discounts/validate", { code, subtotal });
}

export function createOrder(
  token: string,
  input: CreateOrderInput
): Promise<{ order: OrderSummary; payment: { redirectUrl: string } }> {
  return postJson("/orders", input, token);
}

export interface CreateGuestOrderInput extends CreateOrderInput {
  email: string;
  firstName: string;
  lastName: string;
}

export function createGuestOrder(
  input: CreateGuestOrderInput
): Promise<{ order: OrderSummary; payment: { redirectUrl: string }; guestToken: string }> {
  return postJson("/orders/guest", input);
}

export function confirmOrderPayment(
  orderId: string,
  auth: { token?: string; guestToken?: string }
): Promise<OrderSummary> {
  const qs = auth.guestToken ? `?guestToken=${encodeURIComponent(auth.guestToken)}` : "";
  return postJson(`/orders/${orderId}/confirm-payment${qs}`, {}, auth.token);
}

export async function fetchMyOrders(token: string): Promise<OrderSummary[]> {
  const res = await fetch(`${API_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
  return res.json() as Promise<OrderSummary[]>;
}

// ---------- Authenticated fetch helper ----------

async function authFetch<T>(
  path: string,
  token: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Request to ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Gift cards ----------

export interface GiftCardBalance {
  code: string;
  balance: number;
  initialBalance: number;
  status: "ACTIVE" | "REDEEMED" | "DISABLED";
  expiresAt: string | null;
}

export interface GiftCard extends GiftCardBalance {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  message: string | null;
  createdAt: string;
}

export function fetchGiftCardBalance(code: string): Promise<GiftCardBalance> {
  return apiFetch<GiftCardBalance>(`/gift-cards/${encodeURIComponent(code)}`);
}

export function purchaseGiftCard(
  token: string,
  input: { amount: number; recipientEmail: string; recipientName?: string; message?: string }
): Promise<GiftCard> {
  return authFetch("/gift-cards/purchase", token, { method: "POST", body: input });
}

export function fetchMyGiftCards(token: string): Promise<GiftCard[]> {
  return authFetch("/gift-cards/mine", token);
}

// ---------- Reviews ----------

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  customer: { firstName: string; lastName: string };
}

export interface ProductReviews {
  reviews: Review[];
  averageRating: number;
  count: number;
}

export function fetchProductReviews(productId: string): Promise<ProductReviews> {
  return apiFetch<ProductReviews>(`/reviews/product/${productId}`);
}

export function submitReview(
  token: string,
  productId: string,
  input: { rating: number; title?: string; body: string }
): Promise<Review> {
  return authFetch(`/reviews/product/${productId}`, token, { method: "POST", body: input });
}

// ---------- Blog ----------

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string | null;
  createdAt: string;
}

export function fetchBlogPosts(): Promise<BlogPost[]> {
  return apiFetch<BlogPost[]>("/blog");
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await apiFetch<BlogPost>(`/blog/${slug}`);
  } catch {
    return null;
  }
}

// ---------- Banners ----------

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
}

export function fetchBanners(): Promise<Banner[]> {
  return apiFetch<Banner[]>("/banners");
}

// ---------- Wishlist (logged-in customers only — server is source of truth) ----------

export function fetchWishlist(token: string): Promise<string[]> {
  return authFetch("/wishlist", token);
}

export function addWishlistItem(token: string, productId: string): Promise<string[]> {
  return authFetch(`/wishlist/${productId}`, token, { method: "POST" });
}

export function removeWishlistItem(token: string, productId: string): Promise<string[]> {
  return authFetch(`/wishlist/${productId}`, token, { method: "DELETE" });
}

export function syncWishlist(token: string, productIds: string[]): Promise<string[]> {
  return authFetch("/wishlist/sync", token, { method: "POST", body: { productIds } });
}

// ---------- Cart (logged-in customers only — server is source of truth) ----------

export interface ServerCartLine {
  productId: string;
  size: string;
  color: string;
  qty: number;
}

export function fetchCart(token: string): Promise<ServerCartLine[]> {
  return authFetch("/cart", token);
}

export function addCartLine(token: string, line: ServerCartLine): Promise<ServerCartLine[]> {
  return authFetch("/cart", token, { method: "POST", body: line });
}

export function setCartLineQty(token: string, line: ServerCartLine): Promise<ServerCartLine[]> {
  return authFetch("/cart", token, { method: "PUT", body: line });
}

export function removeCartLine(
  token: string,
  line: { productId: string; size: string; color: string }
): Promise<ServerCartLine[]> {
  const qs = new URLSearchParams(line).toString();
  return authFetch(`/cart/line?${qs}`, token, { method: "DELETE" });
}

export function clearServerCart(token: string): Promise<ServerCartLine[]> {
  return authFetch("/cart", token, { method: "DELETE" });
}

export function syncCart(token: string, lines: ServerCartLine[]): Promise<ServerCartLine[]> {
  return authFetch("/cart/sync", token, { method: "POST", body: { lines } });
}

// ---------- Profile ----------

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthday: string | null;
  storeCreditBalance: number;
}

export function fetchMyProfile(token: string): Promise<CustomerProfile> {
  return authFetch("/auth/me/profile", token);
}

export function updateMyProfile(
  token: string,
  input: { birthday?: string }
): Promise<CustomerProfile> {
  return authFetch("/auth/me/profile", token, { method: "PATCH", body: input });
}

// ---------- Store credit ----------

export interface StoreCreditTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  order: { number: string } | null;
}

export interface StoreCreditSummary {
  balance: number;
  transactions: StoreCreditTransaction[];
}

export function fetchMyStoreCredit(token: string): Promise<StoreCreditSummary> {
  return authFetch("/store-credit/me", token);
}
