import { AuthParams } from "../../packages/common/auth/types";
import { BaseManager } from "../BaseManager";
import Stripe from "stripe";
import { KVCache } from "../../lib/cache/kvCache";
import pLimit from "p-limit";
import { ok, err, Result } from "../../packages/common/result";

const adminKVCache = new KVCache(24 * 60 * 60 * 1000); // 1 day in milliseconds

export class AdminManager extends BaseManager {
  private stripe: Stripe;

  // Configuration settings for API fetching
  private config = {
    parallelSubscriptionPages: 50, // How many subscription pages to fetch in parallel
    parallelInvoiceChunks: 50, // How many invoice day chunks to process in parallel
    subscriptionRateLimit: 50, // Max subscription requests per second
    invoiceRateLimit: 50, // Max invoice requests per second
    monthsOfInvoices: 6, // How many months of invoice history to fetch
  };

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-06-20",
    });
  }

  /**
   * Fetch a page from any Stripe API endpoint with retry logic
   */
  private async fetchPage<T>(
    fetchFunction: (params: any) => Promise<Stripe.ApiList<T>>,
    params: any = {}
  ): Promise<{
    items: T[];
    hasMore: boolean;
    lastId?: string;
  }> {
    const maxRetries = 3;
    let retryCount = 0;
    let baseDelay = 1000;

    while (retryCount <= maxRetries) {
      try {
        const result = await fetchFunction(params);
        const lastItem =
          result.data.length > 0
            ? (result.data[result.data.length - 1] as any)
            : null;

        return {
          items: result.data,
          hasMore: result.has_more,
          lastId: lastItem?.id,
        };
      } catch (error: any) {
        if (error.type === "StripeRateLimitError" && retryCount < maxRetries) {
          retryCount++;
          const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.warn(
            `[AdminManager] Rate limit hit, retry ${retryCount}/${maxRetries} after ${delay}ms delay`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error(`[AdminManager] Error fetching page:`, error);
          throw error;
        }
      }
    }

    throw new Error("Maximum retries exceeded for fetchPage");
  }

  /**
   * Fetch all subscriptions with rate limiting
   */
  private async getSubscriptions(): Promise<
    Result<Stripe.Subscription[], string>
  > {
    const cacheKey = `subscriptions-${this.authParams.organizationId}`;
    const cachedData = await adminKVCache.get<Stripe.Subscription[]>(cacheKey);

    if (cachedData) {
      return ok(cachedData);
    }

    console.time("fetchSubscriptions");

    try {
      // First get total count with a single request
      const firstPage = await this.fetchPage((params) =>
        this.stripe.subscriptions.list({
          limit: 1,
          status: "all",
        })
      );

      // Using Stripe has_more and a single item, we can estimate total pages
      const totalPages = Math.ceil(firstPage.hasMore ? 10000 : 1);

      // Use cursors to fetch pages in parallel
      const allSubscriptions: Stripe.Subscription[] = [];
      let currentCursor: string | undefined = undefined;

      while (true) {
        // Create batch of parallel requests
        const pagePromises: Promise<Stripe.Subscription[]>[] = [];
        const cursors: (string | undefined)[] = [currentCursor];

        // Build batch of parallel requests using cursors
        for (let i = 0; i < this.config.parallelSubscriptionPages; i++) {
          const thisCursor = cursors[i];

          const pagePromise = this.fetchPage(
            (params) =>
              this.stripe.subscriptions.list({
                ...params,
                status: "all",
                expand: [
                  "data.customer",
                  "data.items.data.price",
                  "data.discount",
                  "data.discount.coupon",
                ],
                limit: 100,
              }),
            thisCursor ? { starting_after: thisCursor } : {}
          ).then((result) => {
            // Save next cursor
            if (result.hasMore && result.lastId) {
              cursors.push(result.lastId);
            }
            return result.items;
          });

          pagePromises.push(pagePromise);

          // If we don't have a cursor for the next request, we're done
          if (i + 1 >= cursors.length) break;
        }

        // If no promises were created, we're done
        if (pagePromises.length === 0) break;

        // Execute batch of requests
        const results = await Promise.all(pagePromises);

        // Add results to full list
        let totalFetched = 0;
        results.forEach((items) => {
          allSubscriptions.push(...items);
          totalFetched += items.length;
        });

        // Update cursor for next batch
        currentCursor = cursors[cursors.length - 1];

        // If we didn't get a new cursor, we're done
        if (cursors.length <= 1) break;

        // Rate limiting between batches
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 / this.config.subscriptionRateLimit)
        );
      }

      console.timeEnd("fetchSubscriptions");

      // Cache the result
      await adminKVCache.set(cacheKey, allSubscriptions);

      return ok(allSubscriptions);
    } catch (error) {
      console.error("[AdminManager] Error fetching subscriptions:", error);
      return err(`Failed to fetch subscriptions: ${error}`);
    }
  }

  /**
   * Fetch invoices by day for last 6 months for better performance
   */
  private async getInvoices(): Promise<Result<Stripe.Invoice[], string>> {
    const cacheKey = `invoices-${this.authParams.organizationId}`;
    const cachedData = await adminKVCache.get<Stripe.Invoice[]>(cacheKey);

    if (cachedData) {
      return ok(cachedData);
    }

    console.time("fetchInvoices");

    try {
      // Last N months (configurable)
      const monthsToFetch = this.config.monthsOfInvoices;
      const now = Date.now();
      const monthsAgo =
        Math.floor(now / 1000) - monthsToFetch * 30 * 24 * 60 * 60;
      const nowSeconds = Math.floor(now / 1000);
      const daySeconds = 24 * 60 * 60;

      // Create daily chunks
      const dateChunks = [];
      for (
        let dayStart = nowSeconds - daySeconds;
        dayStart >= monthsAgo;
        dayStart -= daySeconds
      ) {
        dateChunks.push({
          start: dayStart,
          end: dayStart + daySeconds,
          label: new Date(dayStart * 1000).toISOString().split("T")[0],
        });
      }

      // Process chunks in parallel batches
      const allInvoices: Stripe.Invoice[] = [];
      const parallelChunks = this.config.parallelInvoiceChunks;

      // Process chunks in batches with parallelism
      for (let i = 0; i < dateChunks.length; i += parallelChunks) {
        const batchChunks = dateChunks.slice(i, i + parallelChunks);
        const startTime = Date.now();

        // Create promises for each chunk in the batch
        const chunkPromises = batchChunks.map((chunk) => {
          return this.fetchInvoicesForDay(chunk).catch((error) => {
            console.error(
              `[AdminManager] Error fetching invoices for ${chunk.label}:`,
              error
            );
            return [] as Stripe.Invoice[]; // Return empty array on error
          });
        });

        // Execute batch in parallel
        const results = await Promise.all(chunkPromises);

        // Combine results
        let batchTotal = 0;
        results.forEach((invoices) => {
          allInvoices.push(...invoices);
          batchTotal += invoices.length;
        });

        // Rate limiting between batches
        if (i + parallelChunks < dateChunks.length) {
          const elapsed = Date.now() - startTime;
          const minTimeBetweenBatches = 1000; // 1 second minimum between batches
          const waitTime = Math.max(0, minTimeBetweenBatches - elapsed);
          if (waitTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      // Cache the result
      await adminKVCache.set(cacheKey, allInvoices);

      return ok(allInvoices);
    } catch (error) {
      console.error("[AdminManager] Error fetching invoices:", error);
      return err(`Failed to fetch invoices: ${error}`);
    }
  }

  /**
   * Helper method to fetch all invoices for a specific day
   */
  private async fetchInvoicesForDay(chunk: {
    start: number;
    end: number;
    label: string;
  }): Promise<Stripe.Invoice[]> {
    // Fetch all pages for this day
    let hasMore = true;
    let lastId: string | undefined;
    let dayInvoices: Stripe.Invoice[] = [];

    while (hasMore) {
      const {
        items,
        hasMore: moreAvailable,
        lastId: newLastId,
      } = await this.fetchPage(
        (params) =>
          this.stripe.invoices.list({
            ...params,
            created: {
              gte: chunk.start,
              lt: chunk.end,
            },
            expand: ["data.subscription"],
            limit: 100,
          }),
        lastId ? { starting_after: lastId } : {}
      );

      dayInvoices.push(...items);
      hasMore = moreAvailable;
      lastId = newLastId;
    }

    return dayInvoices;
  }

  /**
   * Process discounts from subscriptions
   */
  private async processDiscounts(
    subscriptions: Stripe.Subscription[]
  ): Promise<Record<string, Stripe.Discount>> {
    const discounts: Record<string, Stripe.Discount> = {};

    // Find subscriptions with discounts
    const subsWithDiscounts = subscriptions.filter(
      (sub) => sub.discount !== null
    );

    // Extract unique coupon IDs
    const couponIds = new Set<string>();
    const subDiscountMap: Record<
      string,
      {
        subId: string;
        discount: Stripe.Discount;
      }[]
    > = {};

    subsWithDiscounts.forEach((sub) => {
      if (sub.discount?.coupon?.id) {
        const couponId = sub.discount.coupon.id;
        couponIds.add(couponId);

        // Group subscriptions by coupon ID for easy mapping later
        if (!subDiscountMap[couponId]) {
          subDiscountMap[couponId] = [];
        }
        subDiscountMap[couponId].push({
          subId: sub.id,
          discount: sub.discount,
        });
      }
    });

    // Fetch all unique coupons in parallel
    const couponPromises = Array.from(couponIds).map(async (couponId) => {
      try {
        const fullCoupon = await this.stripe.coupons.retrieve(couponId);
        return { couponId, fullCoupon, error: null };
      } catch (error) {
        console.error(
          `[AdminManager] Error fetching coupon ${couponId}:`,
          error
        );
        return { couponId, fullCoupon: null, error };
      }
    });

    const couponResults = await Promise.all(couponPromises);

    // Map results back to subscriptions
    couponResults.forEach(({ couponId, fullCoupon }) => {
      if (fullCoupon && subDiscountMap[couponId]) {
        subDiscountMap[couponId].forEach(({ subId, discount }) => {
          // Replace simplified coupon with full coupon data
          discounts[subId] = {
            ...discount,
            coupon: fullCoupon,
          };
        });
      } else if (subDiscountMap[couponId]) {
        // Fall back to incomplete coupon if retrieval failed
        subDiscountMap[couponId].forEach(({ subId, discount }) => {
          discounts[subId] = discount;
        });
      }
    });

    return discounts;
  }

  /**
   * Get all subscription data with parallel processing for subscriptions, invoices, and upcoming invoices
   */
  public async getSubscriptionData(forceRefresh = false): Promise<
    Result<
      {
        subscriptions: Stripe.Subscription[];
        invoices: Stripe.Invoice[];
        discounts: Record<string, Stripe.Discount>;
        upcomingInvoices: Stripe.UpcomingInvoice[];
      },
      string
    >
  > {
    // Create a unique cache key for this organization
    const cacheKey = `subscription-data-${this.authParams.organizationId}`;

    // If forced refresh, clear the caches
    if (forceRefresh) {
      await adminKVCache.set(
        `subscriptions-${this.authParams.organizationId}`,
        null
      );
      await adminKVCache.set(
        `invoices-${this.authParams.organizationId}`,
        null
      );
      await adminKVCache.set(
        `upcoming-invoices-${this.authParams.organizationId}`,
        null
      );
      await adminKVCache.set(cacheKey, null);
    }

    // Try to get from cache first
    const cachedData = await adminKVCache.get<{
      subscriptions: Stripe.Subscription[];
      invoices: Stripe.Invoice[];
      discounts: Record<string, Stripe.Discount>;
      upcomingInvoices: Stripe.UpcomingInvoice[];
    }>(cacheKey);

    if (cachedData && !forceRefresh) {
      return ok(cachedData);
    }

    try {
      // Fetch subscriptions and invoices in parallel
      const [subscriptionsResult, invoicesResult] = await Promise.all([
        this.getSubscriptions(),
        this.getInvoices(),
      ]);

      // Check for errors
      if (subscriptionsResult.error) {
        return err(subscriptionsResult.error);
      }
      if (invoicesResult.error) {
        return err(invoicesResult.error);
      }

      const subscriptions = subscriptionsResult.data!;
      const invoices = invoicesResult.data!;

      // Process discounts
      const discounts = await this.processDiscounts(subscriptions);

      // Fetch upcoming invoices for all active subscriptions
      const upcomingInvoices = await this.fetchUpcomingInvoices();

      const result = {
        subscriptions,
        invoices,
        discounts,
        upcomingInvoices,
      };

      // Cache the combined result
      await adminKVCache.set(cacheKey, result);

      console.timeEnd("getSubscriptionData");

      return ok(result);
    } catch (error) {
      console.error("[AdminManager] Error in getSubscriptionData:", error);
      return err(`Failed to fetch subscription data: ${error}`);
    }
  }

  /**
   * Fetch upcoming invoices for active subscriptions
   */
  private async fetchUpcomingInvoices(): Promise<Stripe.UpcomingInvoice[]> {
    const cacheKey = `upcoming-invoices-${this.authParams.organizationId}`;
    const cachedData = await adminKVCache.get<Stripe.UpcomingInvoice[]>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const subscriptionsResult = await this.getSubscriptions();

    if (subscriptionsResult.error || !subscriptionsResult.data) {
      console.error(
        "[AdminManager] Error getting subscriptions:",
        subscriptionsResult.error
      );
      return [];
    }

    // Filter active and trialing subscriptions
    const activeSubscriptions = subscriptionsResult.data.filter(
      (s: Stripe.Subscription) =>
        s.status === "active" || s.status === "trialing"
    );

    // Create a concurrency limiter that allows exactly 95 simultaneous requests
    const limit = pLimit(95);

    // Process all subscriptions with controlled concurrency using map-reduce pattern
    const results = await Promise.all(
      activeSubscriptions.map((subscription: Stripe.Subscription) =>
        limit(async () => {
          try {
            return await this.stripe.invoices.retrieveUpcoming({
              subscription: subscription.id,
            });
          } catch (error) {
            console.error(
              `Error fetching upcoming invoice for ${subscription.id}:`,
              error
            );
            return null;
          }
        })
      )
    );

    // Filter out null results and convert to plain objects to avoid Stripe Response object issues
    const upcomingInvoices = results
      .filter((result) => result !== null)
      .map((invoice) => invoice as Stripe.UpcomingInvoice);

    await adminKVCache.set(cacheKey, upcomingInvoices);
    return upcomingInvoices;
  }
}
