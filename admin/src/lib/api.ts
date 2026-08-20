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
}

export function addVariant(token: string, productId: string, input: VariantInput): Promise<AdminProduct> {
  return request(`/products/${productId}/variants`, { method: "POST", token, body: input });
}

export function updateVariant(
  token: string,
  productId: string,
  variantId: string,
  input: Partial<Pick<VariantInput, "stock" | "colorHex">>
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
