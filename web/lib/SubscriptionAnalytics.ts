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
  getSubscriptionAnalytics(subscriptionId: string): {
    currentMRR: number;
    lifetimeValue: number;
    startDate: Date;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      mrr: number;
    }>;
  } {
    if (this.subscriptionAnalyticsCache.has(subscriptionId)) {
      return this.subscriptionAnalyticsCache.get(subscriptionId);
    }

    const subscription = this.subscriptions.find(
      (sub) => sub.id === subscriptionId
    );
    if (!subscription) {
      return {
        currentMRR: 0,
        lifetimeValue: 0,
        startDate: new Date(),
        items: [],
      };
    }

    const currentMRR = calculateMRR(subscription);
    const startDate = new Date(subscription.created * 1000);

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
      currentMRR,
      lifetimeValue,
      startDate,
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

    const filteredInvoices = this.invoices.filter(
      (invoice) =>
        typeof invoice.subscription === "string" &&
        invoice.subscription === subscriptionId
    );

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
}
