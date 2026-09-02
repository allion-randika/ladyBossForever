const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type AdminRole =
  | "SUPER_ADMIN"
  | "INVENTORY_MANAGER"
  | "ORDER_MANAGER"
  | "ACCOUNTANT"
  | "MARKETING_MANAGER";

export interface AdminSession {
  accessToken: string;
  user: { id: string; email: string; name: string; role: AdminRole };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown; token?: string; query?: Record<string, string | undefined> }
): Promise<T> {
  const qs = init?.query
    ? Object.entries(init.query).filter(([, v]) => v !== undefined && v !== "")
    : [];
  const search = qs.length ? `?${new URLSearchParams(qs as [string, string][]).toString()}` : "";

  const res = await fetch(`${API_URL}${path}${search}`, {
    method: init?.method ?? "GET",
    headers: {
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : (data?.message ?? `Request to ${path} failed with ${res.status}`);
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export { ApiError };

// ---------- Auth ----------

export function adminLogin(email: string, password: string): Promise<AdminSession> {
  return request<AdminSession>("/auth/admin/login", { method: "POST", body: { email, password } });
}

// ---------- Dashboard ----------

export interface DashboardSummary {
  totalRevenue: number;
  orderCount: number;
  todayOrderCount: number;
  pendingOrderCount: number;
  topProducts: { id: string; name: string; slug: string; price: number; unitsSold: number }[];
}

export function fetchDashboardSummary(token: string): Promise<DashboardSummary> {
  return request("/dashboard/summary", { token });
}

// ---------- Categories ----------

export interface Category {
  id: string;
  slug: string;
  label: string;
}

export function fetchCategories(): Promise<Category[]> {
  return request("/categories");
}

// ---------- Products ----------

export interface AdminVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  reservedStock: number;
  costPrice: number | null;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string[];
  price: number;
  compareAtPrice: number | null;
  categoryId: string;
  isNew: boolean;
  isBestseller: boolean;
  isOnSale: boolean;
  category: Category;
  variants: AdminVariant[];
}

export function fetchAdminProducts(query?: { q?: string; category?: string }): Promise<AdminProduct[]> {
  return request("/products", { query });
}

// There's no GET-by-id route (the public GET is by slug) — the edit page
// loads the full list and finds the product it needs from that.
export async function fetchAdminProduct(id: string): Promise<AdminProduct | undefined> {
  const products = await fetchAdminProducts();
  return products.find((p) => p.id === id);
}

export interface ProductInput {
  slug: string;
  name: string;
  description: string;
  details: string[];
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isOnSale?: boolean;
  variants: { size: string; color: string; colorHex: string; stock: number }[];
}

export function createProduct(token: string, input: ProductInput): Promise<AdminProduct> {
  return request("/products", { method: "POST", token, body: input });
}

export function updateProduct(
  token: string,
  id: string,
  input: Partial<Omit<ProductInput, "variants">>
): Promise<AdminProduct> {
  return request(`/products/${id}`, { method: "PATCH", token, body: input });
}

export function deleteProduct(token: string, id: string): Promise<void> {
  return request(`/products/${id}`, { method: "DELETE", token });
}

export interface VariantInput {
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  costPrice?: number;
}

export function addVariant(token: string, productId: string, input: VariantInput): Promise<AdminProduct> {
  return request(`/products/${productId}/variants`, { method: "POST", token, body: input });
}

export function updateVariant(
  token: string,
  productId: string,
  variantId: string,
  input: Partial<Pick<VariantInput, "stock" | "colorHex" | "costPrice">>
): Promise<AdminProduct> {
  return request(`/products/${productId}/variants/${variantId}`, { method: "PATCH", token, body: input });
}

export function removeVariant(token: string, productId: string, variantId: string): Promise<AdminProduct> {
  return request(`/products/${productId}/variants/${variantId}`, { method: "DELETE", token });
}

// ---------- Orders ----------

export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "CARD_PAYHERE" | "PAYZY" | "MINTPAY" | "KOKO";

export interface AdminOrderItem {
  id: string;
  qty: number;
  unitPrice: number;
  product: { id: string; name: string; slug: string };
  variant: { id: string; size: string; color: string };
}

export interface AdminOrder {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  createdAt: string;
  guestToken: string | null;
  customer: { id: string; email: string; firstName: string; lastName: string };
  items: AdminOrderItem[];
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string | null;
    phone: string;
  };
}

export function fetchAdminOrders(token: string, status?: OrderStatus): Promise<AdminOrder[]> {
  return request("/orders/admin/all", { token, query: { status } });
}

export function updateOrderStatus(token: string, orderId: string, status: OrderStatus): Promise<AdminOrder> {
  return request(`/orders/${orderId}/status`, { method: "PATCH", token, body: { status } });
}

// ---------- Customers ----------

export interface CustomerListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  _count: { orders: number };
}

export interface CustomerDetail extends CustomerListItem {
  orders: AdminOrder[];
}

export function fetchCustomers(token: string): Promise<CustomerListItem[]> {
  return request("/customers", { token });
}

export function fetchCustomer(token: string, id: string): Promise<CustomerDetail> {
  return request(`/customers/${id}`, { token });
}

// ---------- Audit log ----------

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: string;
  admin: { id: string; name: string; email: string; role: AdminRole };
}

export function fetchAuditLog(token: string): Promise<AuditLogEntry[]> {
  return request("/audit-log", { token });
}

// ---------- Discounts ----------

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountInput {
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount?: number;
  usageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export function fetchDiscounts(token: string): Promise<Discount[]> {
  return request("/discounts", { token });
}

export function createDiscount(token: string, input: DiscountInput): Promise<Discount> {
  return request("/discounts", { method: "POST", token, body: input });
}

export function updateDiscount(
  token: string,
  id: string,
  input: Partial<Omit<DiscountInput, "code">>
): Promise<Discount> {
  return request(`/discounts/${id}`, { method: "PATCH", token, body: input });
}

export function deleteDiscount(token: string, id: string): Promise<void> {
  return request(`/discounts/${id}`, { method: "DELETE", token });
}

// ---------- Gift cards ----------

export type GiftCardStatus = "ACTIVE" | "REDEEMED" | "DISABLED";

export interface AdminGiftCard {
  id: string;
  code: string;
  initialBalance: number;
  balance: number;
  recipientEmail: string;
  recipientName: string | null;
  message: string | null;
  status: GiftCardStatus;
  expiresAt: string | null;
  createdAt: string;
  purchaser: { id: string; email: string } | null;
  issuedByAdmin: { id: string; name: string } | null;
}

export interface IssueGiftCardInput {
  amount: number;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  expiresAt?: string;
}

export function fetchGiftCards(token: string): Promise<AdminGiftCard[]> {
  return request("/gift-cards/admin/all", { token });
}

export function issueGiftCard(token: string, input: IssueGiftCardInput): Promise<AdminGiftCard> {
  return request("/gift-cards/admin/issue", { method: "POST", token, body: input });
}

// ---------- Reviews ----------

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
  product: { id: string; name: string; slug: string };
}

export function fetchPendingReviews(token: string): Promise<AdminReview[]> {
  return request("/reviews/pending", { token });
}

export function approveReview(token: string, id: string): Promise<AdminReview> {
  return request(`/reviews/${id}/approve`, { method: "PATCH", token });
}

export function rejectReview(token: string, id: string): Promise<void> {
  return request(`/reviews/${id}`, { method: "DELETE", token });
}

// ---------- Blog ----------

export type PostStatus = "DRAFT" | "PUBLISHED";

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string } | null;
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status?: PostStatus;
}

export function fetchBlogPostsAdmin(token: string): Promise<AdminBlogPost[]> {
  return request("/blog/admin/all", { token });
}

export function createBlogPost(token: string, input: BlogPostInput): Promise<AdminBlogPost> {
  return request("/blog", { method: "POST", token, body: input });
}

export function updateBlogPost(
  token: string,
  id: string,
  input: Partial<Omit<BlogPostInput, "slug">>
): Promise<AdminBlogPost> {
  return request(`/blog/${id}`, { method: "PATCH", token, body: input });
}

export function deleteBlogPost(token: string, id: string): Promise<void> {
  return request(`/blog/${id}`, { method: "DELETE", token });
}

// ---------- Banners ----------

export interface AdminBanner {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  position: number;
  isActive: boolean;
  createdAt: string;
}

export interface BannerInput {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  position?: number;
  isActive?: boolean;
}

export function fetchBannersAdmin(token: string): Promise<AdminBanner[]> {
  return request("/banners/admin/all", { token });
}

export function createBanner(token: string, input: BannerInput): Promise<AdminBanner> {
  return request("/banners", { method: "POST", token, body: input });
}

export function updateBanner(token: string, id: string, input: Partial<BannerInput>): Promise<AdminBanner> {
  return request(`/banners/${id}`, { method: "PATCH", token, body: input });
}

export function deleteBanner(token: string, id: string): Promise<void> {
  return request(`/banners/${id}`, { method: "DELETE", token });
}

// ---------- Expenses ----------

export type ExpenseCategory = "STOCK" | "ADS" | "SALARIES" | "RENT" | "PACKAGING" | "OTHER";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  incurredAt: string;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  description: string;
  amount: number;
  incurredAt?: string;
}

export function fetchExpenses(token: string): Promise<Expense[]> {
  return request("/expenses", { token });
}

export function createExpense(token: string, input: ExpenseInput): Promise<Expense> {
  return request("/expenses", { method: "POST", token, body: input });
}

export function updateExpense(token: string, id: string, input: Partial<ExpenseInput>): Promise<Expense> {
  return request(`/expenses/${id}`, { method: "PATCH", token, body: input });
}

export function deleteExpense(token: string, id: string): Promise<void> {
  return request(`/expenses/${id}`, { method: "DELETE", token });
}

// ---------- Accounts ----------

export interface AccountsSummary {
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  unitsMissingCost: number;
}

export interface ProductProfit {
  id: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  unitsMissingCost: number;
}

export function fetchAccountsSummary(token: string): Promise<AccountsSummary> {
  return request("/accounts/summary", { token });
}

export function fetchProfitability(token: string): Promise<ProductProfit[]> {
  return request("/accounts/profitability", { token });
}
