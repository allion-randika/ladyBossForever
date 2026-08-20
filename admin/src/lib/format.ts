export function formatLKR(amount: number): string {
  return "Rs. " + amount.toLocaleString("en-LK", { maximumFractionDigits: 0 });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
