import type { OrderStatus } from "@/lib/api";

const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-warning-bg text-warning",
  PAID: "bg-success-bg text-success",
  FULFILLED: "bg-plum/10 text-plum",
  CANCELLED: "bg-danger-bg text-danger",
  REFUNDED: "bg-danger-bg text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
