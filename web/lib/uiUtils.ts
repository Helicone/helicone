/**
 * UI Helper Functions
 */

// Truncate subscription IDs
export const truncateSubscriptionId = (subscriptionId: string): string => {
  if (!subscriptionId) return "";
  if (subscriptionId.length <= 12) return subscriptionId;
  const lastPart = subscriptionId.slice(-4);
  return `sub_...${lastPart}`;
};

// Truncate invoice IDs
export const truncateInvoiceId = (invoiceId: string): string => {
  if (!invoiceId) return "";
  if (invoiceId.length <= 12) return invoiceId;
  const lastPart = invoiceId.slice(-4);
  return `in_...${lastPart}`;
};

// Truncate email addresses
export const truncateEmail = (email: string): string => {
  if (!email) return "Unknown";
  if (email.length <= 20) return email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email.substring(0, 17) + "...";
  const username = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  if (username.length <= 10) return email;
  return username.substring(0, 7) + "..." + domain;
};

// Create subscription link
export const getSubscriptionLink = (subscriptionId: string): string => {
  return `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
};

export function getInvoiceLink(
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

// Format Unix timestamp to readable date
export const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "-";
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Get badge color classes for subscription status
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
    // ... other cases ...
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
};

// Get badge color classes for tier
export const getTierBadgeClasses = (tier: string): string => {
  const tierLower = tier?.toLowerCase() || "";
  if (tierLower.includes("enterprise")) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
  }
  // ... other cases ...
  else {
    return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
};
