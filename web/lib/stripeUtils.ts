import type Stripe from "stripe";

/**
 * Format currency values with proper symbol and decimals
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currency = "usd"
): string => {
  if (amount === null || amount === undefined) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

/**
 * Format Unix timestamp to readable date
 */
export const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Calculate Monthly Recurring Revenue from a subscription
 */
export const calculateMRR = (subscription: Stripe.Subscription): number => {
  let mrr = 0;

  subscription.items.data.forEach((item) => {
    if (!item.price?.recurring || !item.price.unit_amount) return;

    const itemMRR = calculateItemMRR(item);
    mrr += itemMRR;
  });

  return mrr;
};

/**
 * Calculate MRR for a specific subscription item
 */
export const calculateItemMRR = (item: Stripe.SubscriptionItem): number => {
  if (!item.price?.recurring || !item.price.unit_amount) return 0;

  const unitAmount = item.price.unit_amount;
  const quantity = item.quantity || 1;

  // Convert to monthly amount
  let monthlyAmount = unitAmount;
  if (item.price.recurring.interval === "year") {
    monthlyAmount = unitAmount / 12;
  } else if (item.price.recurring.interval === "week") {
    monthlyAmount = unitAmount * 4;
  } else if (item.price.recurring.interval === "day") {
    monthlyAmount = unitAmount * 30;
  }

  // Adjust for interval count
  monthlyAmount = monthlyAmount / (item.price.recurring.interval_count || 1);

  // Multiply by quantity
  return monthlyAmount * quantity;
};

/**
 * Get product name from various product formats
 */
export const getProductName = (
  product: string | Stripe.Product | Stripe.DeletedProduct | null | undefined
): string => {
  if (!product) return "Unknown";
  if (typeof product === "string") return product;

  // Check if product is DeletedProduct
  if (!("name" in product)) return "Deleted Product";

  return product.name;
};

/**
 * Format a date according to the specified interval
 */
export const formatDateByInterval = (
  date: Date,
  interval: "day" | "week" | "month" | "year"
): string => {
  switch (interval) {
    case "day":
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    case "week":
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
      return startOfWeek.toISOString().split("T")[0];
    case "month":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    case "year":
      return String(date.getFullYear());
    default:
      return date.toISOString().split("T")[0];
  }
};

/**
 * Calculate MRR from an invoice line item
 */
export const calculateMRRFromInvoiceLine = (
  line: Stripe.InvoiceLineItem
): number => {
  if (!line.period || !line.amount) return 0;

  // Calculate period duration in days
  const startDate = new Date(line.period.start * 1000);
  const endDate = new Date(line.period.end * 1000);
  const periodDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate daily rate
  const dailyRate = line.amount / periodDays;

  // Approximate monthly rate (30 days)
  return dailyRate * 30;
};

/**
 * Get product ID from a subscription item
 */
export const getProductIdFromItem = (item: Stripe.SubscriptionItem): string => {
  if (!item.price?.product) return "unknown";

  return typeof item.price.product === "string"
    ? item.price.product
    : item.price.product.id;
};

/**
 * Get product name from a subscription item
 */
export const getProductNameFromItem = (
  item: Stripe.SubscriptionItem
): string => {
  if (!item.price?.product) return "Unknown";

  return getProductName(item.price.product);
};

/**
 * Group invoices by subscription ID
 */
export const groupInvoicesBySubscription = (
  invoices: Stripe.Invoice[]
): Record<string, Stripe.Invoice[]> => {
  const grouped: Record<string, Stripe.Invoice[]> = {};

  invoices.forEach((invoice) => {
    if (typeof invoice.subscription === "string") {
      if (!grouped[invoice.subscription]) {
        grouped[invoice.subscription] = [];
      }
      grouped[invoice.subscription].push(invoice);
    }
  });

  return grouped;
};

// Export types used by SubscriptionAnalytics
export type AnalyticsMetric = "mrr" | "arr" | "customers" | "churn" | "revenue";
export type TimeInterval = "day" | "week" | "month" | "year";
export type Dimension =
  | "product"
  | "customer"
  | "plan"
  | "subscription"
  | "date";
export type DateRange = { start: Date; end: Date };
