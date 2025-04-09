import type Stripe from "stripe";
import {
  AnalyticsMetric,
  TimeInterval,
  Dimension,
  DateRange,
  calculateMRR,
  calculateItemMRR,
  calculateUpcomingInvoiceLineMRR,
  formatDateByInterval,
  getProductIdFromItem,
  getProductNameFromItem,
  getSubscriptionId,
  ensureNestedRecord,
} from "./stripeUtils";

/**
 * Event types for subscription timeline
 */
export type SubscriptionEventType =
  | "creation"
  | "upgrade"
  | "downgrade"
  | "cancellation"
  | "reactivation";

/**
 * Event in a subscription timeline
 */
export type SubscriptionEvent = {
  date: string;
  type: SubscriptionEventType;
  prevValue?: number;
  newValue: number;
  description: string;
  metadata?: Record<string, any>;
};

/**
 * Options for aggregation operations
 */
export type AggregateOptions = {
  metric: AnalyticsMetric;
  dimensions?: Dimension[];
  filters?: Record<string, any>;
  dateRange?: DateRange;
};

/**
 * Options for timeseries operations
 */
export type TimeSeriesOptions = {
  metric: AnalyticsMetric;
  interval: TimeInterval;
  groupBy?: Dimension;
  subscriptionId?: string;
  includeEvents?: boolean;
  dateRange?: DateRange;
};

/**
 * Result of a timeseries operation
 */
export type TimeSeriesResult = {
  timeseries: Record<string, number | Record<string, number>>;
  events?: SubscriptionEvent[];
};

/**
 * Export type definition
 */
export type SubscriptionAnalyticsResult = {
  id: string;
  currentMRR: number;
  discountedMRR: number;
  lifetimeValue: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    mrr: number;
  }>;
};

export type MRRDataPoint = {
  actual: number;
  projected: number;
};

export type MRRChartData = {
  [month: string]: {
    [productId: string]: MRRDataPoint;
  };
};

/**
 * Analytics engine for subscription data
 */
export class SubscriptionAnalytics {
  private subscriptions: Stripe.Subscription[];
  private invoices: Stripe.Invoice[];
  private discounts: Record<string, Stripe.Discount>;
  private upcomingInvoices: Record<string, any>; // Using 'any' to support Stripe.Response<Stripe.UpcomingInvoice>

  // Cache for computed values
  private mrrCache: Map<string, number | Record<string, number>> = new Map();
  private timeSeriesCache: Map<string, TimeSeriesResult> = new Map();
  private aggregateCache: Map<string, any> = new Map();
  private subscriptionAnalyticsCache: Map<string, any> = new Map();
  private invoicesCache: Map<string, Stripe.Invoice[]> = new Map();

  /**
   * Create a new analytics engine
   */
  constructor(data: {
    subscriptions: Stripe.Subscription[];
    invoices: Stripe.Invoice[];
    discounts: Record<string, Stripe.Discount>;
    upcomingInvoices?: Record<string, any>;
  }) {
    this.subscriptions = data.subscriptions;
    this.invoices = data.invoices;
    this.discounts = data.discounts;
    this.upcomingInvoices = data.upcomingInvoices || {};
  }

  /**
   * Core aggregation method with dimension support
   */
  aggregate<T>(options: AggregateOptions): Record<string, T> {
    throw new Error("Method not implemented");
  }

  /**
   * Get MRR with optional grouping
   */
  getMRR(groupBy?: Dimension): number | Record<string, number> {
    throw new Error("Method not implemented");
  }

  /**
   * Get historical metrics as time series
   */
  getTimeSeries(options: TimeSeriesOptions): TimeSeriesResult {
    throw new Error("Method not implemented");
  }

  /**
   * Get subscription-specific analytics
   */
  getSubscriptionAnalytics(
    subscriptionId: string
  ): SubscriptionAnalyticsResult {
    if (this.subscriptionAnalyticsCache.has(subscriptionId)) {
      return this.subscriptionAnalyticsCache.get(subscriptionId);
    }

    const subscription = this.subscriptions.find(
      (sub) => sub.id === subscriptionId
    );
    if (!subscription) {
      return {
        id: subscriptionId,
        currentMRR: 0,
        discountedMRR: 0,
        lifetimeValue: 0,
        items: [],
      };
    }

    const discount = this.discounts[subscriptionId];
    const currentMRR = calculateMRR(subscription);
    const discountedMRR = calculateMRR(subscription, discount);

    // Calculate lifetime value from invoices
    const subscriptionInvoices =
      this.getInvoicesForSubscription(subscriptionId);
    const lifetimeValue = subscriptionInvoices.reduce((sum, invoice) => {
      return invoice.status === "paid" ? sum + (invoice.total || 0) : sum;
    }, 0);

    // Process items
    const items = subscription.items.data.map((item) => {
      const itemMRR = calculateItemMRR(item);
      return {
        id: item.id,
        productId: getProductIdFromItem(item),
        productName: getProductNameFromItem(item),
        mrr: itemMRR,
      };
    });

    const result = {
      id: subscriptionId,
      currentMRR,
      discountedMRR,
      lifetimeValue,
      items,
    };

    this.subscriptionAnalyticsCache.set(subscriptionId, result);
    return result;
  }

  /**
   * Get invoices for a specific subscription
   */
  getInvoicesForSubscription(subscriptionId: string): Stripe.Invoice[] {
    if (this.invoicesCache.has(subscriptionId)) {
      return this.invoicesCache.get(subscriptionId)!;
    }

    const filteredInvoices = this.invoices.filter((invoice) => {
      // Handle both string subscription ID and object reference
      if (typeof invoice.subscription === "string") {
        return invoice.subscription === subscriptionId;
      } else if (
        invoice.subscription &&
        typeof invoice.subscription === "object"
      ) {
        return invoice.subscription.id === subscriptionId;
      }
      return false;
    });

    // Sort invoices by date (newest first)
    const sortedInvoices = filteredInvoices.sort(
      (a, b) => b.created - a.created
    );

    this.invoicesCache.set(subscriptionId, sortedInvoices);
    return sortedInvoices;
  }

  /**
   * Calculate churn metrics
   */
  getChurnMetrics(period?: DateRange): {
    rate: number;
    mrrChurn: number;
    customerChurn: number;
    retentionRate: number;
  } {
    throw new Error("Method not implemented");
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.mrrCache.clear();
    this.timeSeriesCache.clear();
    this.aggregateCache.clear();
    this.subscriptionAnalyticsCache.clear();
    this.invoicesCache.clear();
  }

  /**
   * Get the raw subscriptions list
   */
  public getRawSubscriptions(): Stripe.Subscription[] {
    return this.subscriptions;
  }

  /**
   * Calculate Monthly Recurring Revenue using the invoice-based approach
   * Uses paid invoices for past months and both paid + upcoming invoices for current month
   */
  getMRRChartData(options?: { months?: number; productIds?: string[] }): {
    data: MRRChartData;
    debug: Record<string, any>;
  } {
    const months = options?.months || 6;

    // Initialize the result structure
    const result: MRRChartData = {};
    const debug: Record<string, any> = {
      invoices: {}, // Paid invoices
      subscriptions: {}, // Reference only - no longer used for projections
      upcomingInvoices: {}, // For current month projected revenue
    };

    // Get the current month in YYYY-MM format
    const today = new Date();
    const currentMonth = formatDateByInterval(today, "month");

    // Create month entries for the result (past months + current)
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = formatDateByInterval(date, "month");
      result[monthKey] = {};
    }

    // 1. Process past invoices for historical data (actual revenue)
    this.invoices.forEach((invoice) => {
      if (invoice.status !== "paid") return;

      const invoiceDate = new Date(invoice.created * 1000);
      const monthKey = formatDateByInterval(invoiceDate, "month");

      // Skip if month not in our date range
      if (!result[monthKey]) return;

      // Process each line item in the invoice
      invoice.lines.data.forEach((line) => {
        if (!line.price?.product) return;

        const productId =
          typeof line.price.product === "string"
            ? line.price.product
            : line.price.product.id;

        // Skip if we're filtering by product and this isn't in the list
        if (options?.productIds && !options.productIds.includes(productId))
          return;

        // Initialize product data if needed
        if (!result[monthKey][productId]) {
          result[monthKey][productId] = { actual: 0, projected: 0 };
        }

        const lineAmount = line.amount;

        // Store debug data for this invoice line
        const debugItems = ensureNestedRecord(
          debug.invoices,
          monthKey,
          productId
        );
        debugItems.push({
          invoiceId: invoice.id,
          subscriptionId: getSubscriptionId(invoice),
          amount: line.amount,
          quantity: line.quantity || 0,
          lineAmount,
          date: invoice.created * 1000,
          description: line.description || "No description",
          customerName: invoice.customer_name || "Unknown",
          customerEmail: invoice.customer_email || "Unknown",
        });

        // For current month invoices, add to actual revenue
        if (monthKey === currentMonth) {
          result[monthKey][productId].actual += lineAmount;
        }
        // For past months, add to the actual revenue
        else {
          result[monthKey][productId].actual += lineAmount;
        }
      });
    });

    // 2. Process upcoming invoices for current month projections
    Object.values(this.upcomingInvoices).forEach((upcomingInvoice: any) => {
      // Skip if no lines data or not an upcoming invoice
      if (!upcomingInvoice?.lines?.data) return;

      // Use period_start instead of period_end for determining the invoice month
      // Many invoices are for the current month even if they're due next month
      const invoiceStartDate = upcomingInvoice.period_start
        ? new Date(upcomingInvoice.period_start * 1000)
        : new Date(upcomingInvoice.created * 1000);

      const invoiceMonth = formatDateByInterval(invoiceStartDate, "month");

      // Only filter if the invoice is clearly for a future month (not current)
      // We want to include all current month subscriptions in projected revenue
      if (invoiceMonth > currentMonth) return;

      // Find subscription id and associated discount (if any)
      const subscriptionId = upcomingInvoice.subscription;
      const discount = subscriptionId
        ? this.discounts[subscriptionId]
        : undefined;

      // Process each line item in the upcoming invoice
      upcomingInvoice.lines.data.forEach((line: any) => {
        if (!line.price?.product) return;

        const productId =
          typeof line.price.product === "string"
            ? line.price.product
            : line.price.product.id;

        // Skip if we're filtering by product and this isn't in the list
        if (options?.productIds && !options.productIds.includes(productId))
          return;

        // Initialize product data for current month if needed
        if (!result[currentMonth][productId]) {
          result[currentMonth][productId] = { actual: 0, projected: 0 };
        }

        // Calculate amount with proper discount handling using the shared utility function
        const lineAmount = calculateUpcomingInvoiceLineMRR(
          line,
          productId,
          discount
        );

        // Add to projected revenue for current month
        result[currentMonth][productId].projected += lineAmount;

        // Store debug data for this upcoming invoice line
        const debugItems = ensureNestedRecord(
          debug.upcomingInvoices,
          currentMonth,
          productId
        );
        debugItems.push({
          subscriptionId: line.subscription || upcomingInvoice.subscription,
          amount: line.amount,
          quantity: line.quantity || 0,
          unitAmount: line.unit_amount || 0,
          date: upcomingInvoice.period_end * 1000, // Due date
          description: line.description || "No description",
          customerName:
            upcomingInvoice.customer_name ||
            upcomingInvoice.customer_email ||
            "Unknown",
          customerEmail: upcomingInvoice.customer_email || "Unknown",
          isMetered: line.type === "usage",
          usageType: line.price?.recurring?.usage_type || "standard",
          period: line.period
            ? {
                start: line.period.start * 1000,
                end: line.period.end * 1000,
              }
            : null,
          discountApplied: !!discount,
          discountPercent: discount?.coupon?.percent_off || 0,
          discountAmount: discount?.coupon?.amount_off || 0,
          originalAmount: line.amount,
          discountedAmount: lineAmount,
          isCredit: line.amount < 0,
        });
      });
    });

    // For completeness, add subscription data to debug (though no longer used for projections)
    this.subscriptions.forEach((subscription) => {
      // Skip inactive subscriptions
      if (
        subscription.status !== "active" &&
        subscription.status !== "trialing"
      )
        return;

      // Get customer information
      let customerName = "Unknown";
      let customerEmail = "Unknown";

      if (subscription.customer) {
        if (typeof subscription.customer === "string") {
          customerName = subscription.customer;
          customerEmail = `${subscription.customer}@example.com`;
        } else if (!("deleted" in subscription.customer)) {
          customerName =
            (subscription.customer.name as string) || subscription.customer.id;
          customerEmail =
            (subscription.customer.email as string) ||
            `${subscription.customer.id}@example.com`;
        }
      }

      // Get discount for this subscription
      const discount = this.discounts[subscription.id];

      // Process subscription items for debug purposes only
      subscription.items.data.forEach((item) => {
        const productId = getProductIdFromItem(item);

        // Skip if we're filtering by product and this isn't in the list
        if (options?.productIds && !options.productIds.includes(productId))
          return;

        // Store debug data (but don't use for MRR calculations anymore)
        const debugItems = ensureNestedRecord(
          debug.subscriptions,
          currentMonth,
          productId
        );

        debugItems.push({
          subscriptionId: subscription.id,
          amount: item.price?.unit_amount || 0,
          quantity: item.quantity || 0,
          nextBillingDate: subscription.current_period_end * 1000,
          customerName,
          customerEmail,
          productName: getProductNameFromItem(item),
          interval: item.price?.recurring?.interval || "unknown",
          discount: discount?.coupon?.percent_off || 0,
          appliedDiscount: !!discount,
          isMetered: item.price?.recurring?.usage_type === "metered",
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      });
    });

    console.log(`MRR Chart Data: ${JSON.stringify(result)}`);
    return { data: result, debug };
  }
}
