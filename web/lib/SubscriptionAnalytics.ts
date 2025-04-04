import type Stripe from "stripe";
import {
  AnalyticsMetric,
  TimeInterval,
  Dimension,
  DateRange,
  calculateMRR,
  calculateItemMRR,
  formatDateByInterval,
  getProductIdFromItem,
  getProductNameFromItem,
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
  }) {
    this.subscriptions = data.subscriptions;
    this.invoices = data.invoices;
    this.discounts = data.discounts;
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

  getMRRChartData(options?: {
    months?: number;
    productIds?: string[];
  }): MRRChartData {
    const months = options?.months || 6;
    const result: MRRChartData = {};

    const today = new Date();
    const currentMonth = formatDateByInterval(today, "month");
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    for (let i = 0; i < months; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = formatDateByInterval(date, "month");
      result[monthKey] = {};
    }

    this.invoices.forEach((invoice) => {
      if (invoice.status !== "paid") return;

      const invoiceDate = new Date(invoice.created * 1000);
      const monthKey = formatDateByInterval(invoiceDate, "month");

      if (!result[monthKey]) return;

      invoice.lines.data.forEach((line) => {
        if (!line.price?.product) return;

        const productId =
          typeof line.price.product === "string"
            ? line.price.product
            : line.price.product.id;

        if (options?.productIds && !options.productIds.includes(productId))
          return;

        if (!result[monthKey][productId]) {
          result[monthKey][productId] = { actual: 0, projected: 0 };
        }

        // Convert to monthly equivalent
        let monthlyAmount = line.amount;
        if (line.period && line.period.start && line.period.end) {
          const periodDuration = line.period.end - line.period.start;
          const monthInSeconds = 30 * 24 * 60 * 60;
          monthlyAmount = (line.amount / periodDuration) * monthInSeconds;
        }

        result[monthKey][productId].actual += monthlyAmount;
      });
    });

    this.subscriptions.forEach((subscription) => {
      if (
        subscription.status !== "active" &&
        subscription.status !== "trialing"
      )
        return;

      const alreadyInvoiced = this.invoices.some(
        (invoice) =>
          (typeof invoice.subscription === "string"
            ? invoice.subscription === subscription.id
            : invoice.subscription?.id === subscription.id) &&
          new Date(invoice.created * 1000) >= currentMonthStart
      );

      if (alreadyInvoiced) return;

      const discount = this.discounts[subscription.id];

      subscription.items.data.forEach((item) => {
        const productId = getProductIdFromItem(item);

        if (options?.productIds && !options.productIds.includes(productId))
          return;

        if (!result[currentMonth][productId]) {
          result[currentMonth][productId] = { actual: 0, projected: 0 };
        }

        // Calculate MRR for this item and apply proportional discount
        let mrr = calculateItemMRR(item);
        const subTotalMRR = calculateMRR(subscription);

        if (discount && subTotalMRR > 0) {
          // Calculate this item's percentage of the total MRR
          const itemProportion = mrr / subTotalMRR;

          // Apply the same proportion of the discount
          if (discount.coupon.percent_off) {
            mrr = mrr * (1 - discount.coupon.percent_off / 100);
          } else if (discount.coupon.amount_off) {
            // Distribute the fixed discount proportionally
            const itemDiscount = itemProportion * discount.coupon.amount_off;
            mrr = Math.max(0, mrr - itemDiscount);
          }
        }

        result[currentMonth][productId].projected += mrr;
      });
    });

    return result;
  }
}
