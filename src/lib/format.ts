export function formatLKR(amount: number): string {
  return "Rs. " + amount.toLocaleString("en-LK", { maximumFractionDigits: 0 });
}
