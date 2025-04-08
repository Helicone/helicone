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
export const calculateMRR = (
  subscription: Stripe.Subscription,
  discount?: Stripe.Discount
): number => {
  let mrr = 0;

  subscription.items.data.forEach((item) => {
    if (!item.price?.recurring || !item.price.unit_amount) return;

    const itemMRR = calculateItemMRR(item, discount);
    mrr += itemMRR;
  });

  return mrr;
};

export function calculateItemMRR(
  item: Stripe.SubscriptionItem,
  discount?: Stripe.Discount
): number {
  if (!item.price) return 0;
  if (!item.price.recurring) return 0;

  const unitAmount = item.price.unit_amount || 0;
  const quantity = item.quantity || 0;

  if (unitAmount === 0 || quantity === 0) return 0;

  let mrr = unitAmount * quantity;

  const interval = item.price.recurring.interval;
  const intervalCount = item.price.recurring.interval_count || 1;

  // Normalize to monthly revenue
  if (interval === "year") {
    mrr = mrr / (12 * intervalCount);
  } else if (interval === "week") {
    mrr = mrr * (4.33 / intervalCount);
  } else if (interval === "day") {
    mrr = mrr * (30 / intervalCount);
  }

  // Apply discount if provided
  if (discount && discount.coupon) {
    const productId = getProductIdFromItem(item);

    // Check if this is a small discount without product restrictions
    const isSmallDiscount =
      discount.coupon.amount_off != null && discount.coupon.amount_off < 5000; // Less than $50
    const hasNoProductRestrictions =
      !discount.coupon.applies_to ||
      !discount.coupon.applies_to.products ||
      discount.coupon.applies_to.products.length === 0;

    if (isSmallDiscount && hasNoProductRestrictions) {
      return mrr;
    }

    // Default: discount applies to all products unless specifically restricted
    let shouldApplyDiscount = true;

    // Only check for restrictions if applies_to.products exists and isn't empty
    if (
      discount.coupon.applies_to &&
      discount.coupon.applies_to.products &&
      discount.coupon.applies_to.products.length > 0
    ) {
      // If product restrictions exist, check if this product is included
      shouldApplyDiscount =
        discount.coupon.applies_to.products.includes(productId);
    }

    if (shouldApplyDiscount) {
      if (discount.coupon.percent_off) {
        mrr = mrr * (1 - discount.coupon.percent_off / 100);
      } else if (discount.coupon.amount_off) {
        mrr = Math.max(0, mrr - discount.coupon.amount_off);
      }
    }
  }

  return mrr;
}

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

/**
 * Get customer email from a subscription
 * Note: This is a helper function for display purposes that creates placeholders
 * when the actual email is not available. In a real implementation, you would use
 * Stripe's API to fetch customer details including email.
 */
export const getCustomerEmail = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string => {
  if (!customer) return "unknown@example.com";

  if (typeof customer === "string") {
    return `${customer}@example.com`; // Placeholder for customer ID
  }

  // Check if customer is not deleted and has email property
  if (!("deleted" in customer) && "email" in customer && customer.email) {
    return customer.email;
  }

  // Fallback to ID-based placeholder
  return `${customer.id}@example.com`;
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

/**
 * Get badge color classes for a subscription status
 */
export const getStatusBadgeClasses = (
  status: string,
  cancelAtPeriodEnd?: boolean
): string => {
  if (cancelAtPeriodEnd) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
  }

  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "trialing":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "past_due":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    case "unpaid":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    case "canceled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    case "incomplete":
    case "incomplete_expired":
      return "bg-gray-200 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400 border-gray-300 dark:border-gray-700";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
};

/**
 * Get badge color classes for a tier
 */
export const getTierBadgeClasses = (tier: string): string => {
  const tierLower = tier?.toLowerCase() || "";

  if (tierLower.includes("enterprise")) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
  } else if (tierLower.includes("team")) {
    return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800";
  } else if (tierLower.includes("pro") || tierLower.includes("growth")) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  } else if (tierLower.includes("free")) {
    return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  } else {
    return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
};

/**
 * Get subscription ID from an invoice, handling both string and object representations
 */
export const getSubscriptionId = (
  invoice: Stripe.Invoice
): string | undefined => {
  return typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;
};

/**
 * Check if quantity is valid for MRR calculation
 */
export const hasValidQuantity = (item: Stripe.SubscriptionItem): boolean => {
  return (item.quantity || 0) > 0;
};

/**
 * Get start of month date
 */
export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * Get end of month date
 */
export const endOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

/**
 * Ensure object exists in a nested record structure
 */
export const ensureNestedRecord = <T>(
  record: Record<string, Record<string, T[]>>,
  outerKey: string,
  innerKey: string
): T[] => {
  record[outerKey] = record[outerKey] || {};
  record[outerKey][innerKey] = record[outerKey][innerKey] || [];
  return record[outerKey][innerKey];
};

/**
 * Calculate MRR for an upcoming invoice line, applying discounts consistently
 * with the same logic as calculateItemMRR
 */
export function calculateUpcomingInvoiceLineMRR(
  line: any, // Upcoming invoice line item
  productId: string,
  discount?: Stripe.Discount
): number {
  if (!line.amount) return 0;

  // Skip negative amounts (credits for unused time)
  if (line.amount < 0) return 0;

  // Start with the line amount (already includes quantity)
  let lineAmount = line.amount;

  // Apply discount if provided, using the same logic as calculateItemMRR
  // Note: Discounts apply to BOTH subscription and usage-based items
  if (discount && discount.coupon) {
    // Check if this is a small discount without product restrictions
    const isSmallDiscount =
      discount.coupon.amount_off != null && discount.coupon.amount_off < 5000; // Less than $50
    const hasNoProductRestrictions =
      !discount.coupon.applies_to ||
      !discount.coupon.applies_to.products ||
      discount.coupon.applies_to.products.length === 0;

    if (isSmallDiscount && hasNoProductRestrictions) {
      return lineAmount;
    }

    // Default: discount applies to all products unless specifically restricted
    let shouldApplyDiscount = true;

    // Only check for restrictions if applies_to.products exists and isn't empty
    if (
      discount.coupon.applies_to &&
      discount.coupon.applies_to.products &&
      discount.coupon.applies_to.products.length > 0
    ) {
      // If product restrictions exist, check if this product is included
      shouldApplyDiscount =
        discount.coupon.applies_to.products.includes(productId);
    }

    if (shouldApplyDiscount) {
      // Apply discount regardless of whether it's a subscription or usage-based item
      if (discount.coupon.percent_off) {
        lineAmount = Math.round(
          lineAmount * (1 - discount.coupon.percent_off / 100)
        );
      } else if (discount.coupon.amount_off) {
        lineAmount = Math.max(0, lineAmount - discount.coupon.amount_off);
      }
    }
  }

  return lineAmount;
}
