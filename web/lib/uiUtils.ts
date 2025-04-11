// Truncate invoice IDs
export const truncateID = (invoiceId: string): string => {
  if (!invoiceId) return "";
  if (invoiceId.length <= 12) return invoiceId;
  const lastPart = invoiceId.slice(-4);
  return `in_...${lastPart}`;
};

export function getStripeLink(
  invoiceId: string,
  subscriptionId?: string
): string {
  if (
    subscriptionId &&
    (invoiceId.startsWith("upcoming") || !invoiceId.includes("in_"))
  ) {
    return `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
  }
  return `https://dashboard.stripe.com/invoices/${invoiceId}`;
}
// Format currency values
export const formatCurrency = (
  amount: number | null | undefined,
  currency = "usd"
): string => {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format month key for display
export const formatMonthKey = (monthKey: string): string => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};
