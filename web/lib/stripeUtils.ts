import { getBaseTier } from "@/utils/tiers";
import type Stripe from "stripe";

// Simple list of tiers to exclude from subscription mapping
export const EXCLUDED_TIERS: string[] = [
  "growth",
  "prod_nofurmov3kstjv",
  // Add other tiers you want to exclude here
];

export type StripeProduct = {
  id: string;
  name: string;
  // Add other relevant product fields if needed
};

export type StripeDiscount = {
  id: string;
  couponId: string;
  type: "percentage" | "fixed";
  amount: number;
  duration: "forever" | "once" | "repeating";
  durationInMonths?: number;
  validUntil?: number;
  appliesTo?: {
    productIds: string[];
  };
  isSubscriptionLevel: boolean;
};

export type Subscription = {
  id: string;
  customerId: string;
  customerEmail?: string;
  tier: string;
  baseTier: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  createdAt: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  rawData: Stripe.Subscription;
  discounts: StripeDiscount[];
  items: SubscriptionItem[];
  totalMRR: number;
  baseMRR: number;
  discountAmount: number;
};

export type SubscriptionItem = {
  id: string;
  productId: string;
  productName: string;
  price: {
    id: string;
    unitAmount: number; // In cents
    interval: "month" | "year";
    intervalCount: number;
  };
  quantity: number;
  baseMRR: number;
  mrr: number;
  discountAmount: number;
  discounts: StripeDiscount[];
};

// Map product IDs to human-readable names
export const PRODUCT_DISPLAY_MAP: Record<string, string> = {
  //   prod_QrcNwy2KPKiZJ5: "Users",
  //   prod_Rhx8ZQYhQOuunD: "Experiments",
  //   prod_Rhx7VbaUg1d1zA: "Evals",
  prod_QrcOEoxIc76n6K: "Prompts",
  //   prod_QrcOiRXHYgObqs: "Alerts",
  //   prod_Rhx6vMVdGqih1E: "Team",
  //   prod_PpPUGArb7KCAZT: "Usage",
};

/**
 * Converts a Stripe discount to our internal StripeDiscount format
 */
const mapDiscount = (
  discount: Stripe.Discount,
  isSubscriptionLevel = true
): StripeDiscount => {
  const coupon = discount.coupon;
  return {
    id: discount.id,
    couponId: coupon.id,
    type: coupon.percent_off ? "percentage" : "fixed",
    amount: coupon.percent_off || coupon.amount_off || 0,
    duration: coupon.duration,
    durationInMonths: coupon.duration_in_months ?? undefined,
    validUntil: discount.end ? Number(discount.end) : undefined,
    appliesTo: coupon.applies_to
      ? {
          productIds: coupon.applies_to.products || [],
        }
      : undefined,
    isSubscriptionLevel,
  };
};

/**
 * Maps an array of Stripe coupon objects to our internal StripeDiscount format
 */
export const mapDiscounts = (
  coupons: Stripe.Coupon[]
): Record<string, StripeDiscount> => {
  const discountMap: Record<string, StripeDiscount> = {};

  coupons.forEach((coupon) => {
    // Create a dummy discount object with the coupon data
    const discount = {
      id: coupon.id, // Using coupon ID as discount ID
      coupon,
      end: undefined, // Adding undefined end date for the discount
    } as unknown as Stripe.Discount;

    discountMap[coupon.id] = mapDiscount(discount, false);
  });

  return discountMap;
};

const calculateItemMRR = (
  unitAmount: number | null | undefined,
  quantity: number | null | undefined,
  interval: "month" | "year",
  intervalCount: number
): number => {
  // Handle null/undefined values with safe defaults
  const amount = unitAmount ?? 0;
  const qty = quantity ?? 0;

  // Convert to monthly amount
  let monthlyAmount = amount;
  if (interval === "year") {
    monthlyAmount = amount / 12;
  }

  // Adjust for interval count
  monthlyAmount = monthlyAmount / intervalCount;

  // Calculate total
  return monthlyAmount * qty;
};

/**
 * Process a single subscription from the Jawn API into our Subscription format
 */
export const processSubscriptionData = (
  rawSubscription: Stripe.Subscription,
  couponMap?: Record<string, StripeDiscount>
): Subscription => {
  // Extract customer information
  const customerId =
    typeof rawSubscription.customer === "string"
      ? rawSubscription.customer
      : rawSubscription.customer.id;

  let customerEmail: string | undefined = undefined;
  if (typeof rawSubscription.customer !== "string") {
    // Only access email if customer is not a string and not a DeletedCustomer
    const customer = rawSubscription.customer;
    if ("email" in customer) {
      customerEmail = customer.email ?? undefined;
    }
  }

  // Map subscription discounts
  const subscriptionDiscounts: StripeDiscount[] = [];
  if (rawSubscription.discount) {
    subscriptionDiscounts.push(mapDiscount(rawSubscription.discount));
  }

  // Handle discounts array which might be strings or Discount objects
  if (rawSubscription.discounts && rawSubscription.discounts.length > 0) {
    rawSubscription.discounts.forEach((discountItem) => {
      // Only process if it's an object, not a string ID
      if (typeof discountItem !== "string" && "coupon" in discountItem) {
        subscriptionDiscounts.push(mapDiscount(discountItem));
      }
    });
  }

  // First, calculate the total base MRR to use for proportional distribution of fixed discounts
  let totalBaseMRR = 0;
  const itemBaseValues = rawSubscription.items.data.map((item) => {
    const baseMRR = calculateItemMRR(
      item.price?.unit_amount,
      item.quantity,
      (item.price?.recurring?.interval as "month" | "year") || "month",
      item.price?.recurring?.interval_count || 1
    );
    totalBaseMRR += baseMRR;
    return baseMRR;
  });

  // Process subscription items
  const items: SubscriptionItem[] = rawSubscription.items.data.map(
    (item, index) => {
      // Get product information
      const productId =
        typeof item.price?.product === "string"
          ? item.price.product
          : item.price?.product
          ? item.price.product.id
          : "";

      let productName = PRODUCT_DISPLAY_MAP[productId] || productId;

      // If product is an object and has a name property
      if (typeof item.price?.product !== "string" && item.price?.product) {
        const product = item.price.product;
        if ("name" in product) {
          productName = product.name;
        }
      }

      // Base MRR without any discounts
      const baseMRR = itemBaseValues[index];

      // Item-specific discounts that apply to this item from the subscription's discounts
      const itemDiscounts: StripeDiscount[] = [];

      // Add subscription-level discounts to this item
      subscriptionDiscounts.forEach((discount) => {
        // Check if the discount applies to specific products
        if (
          discount.appliesTo?.productIds &&
          discount.appliesTo.productIds.length > 0
        ) {
          // Only apply if this product is in the list
          if (discount.appliesTo.productIds.includes(productId)) {
            itemDiscounts.push(discount);
          }
        } else {
          // Discount applies to all items
          // For percentage discounts, apply directly
          // For fixed discounts, distribute proportionally based on item's contribution to total MRR
          if (discount.type === "percentage") {
            itemDiscounts.push(discount);
          } else if (discount.type === "fixed" && totalBaseMRR > 0) {
            // Create a copy with adjusted amount based on proportion
            const proportion = baseMRR / totalBaseMRR;
            const proRatedDiscount = {
              ...discount,
              amount: discount.amount * proportion,
              isProRated: true,
            };
            itemDiscounts.push(proRatedDiscount);
          }
        }
      });

      // Calculate discount amount
      let discountAmount = 0;
      itemDiscounts.forEach((discount) => {
        if (discount.type === "percentage") {
          discountAmount += (baseMRR * discount.amount) / 100;
        } else if (discount.type === "fixed") {
          discountAmount += discount.amount;
        }
      });

      // Calculate final MRR after discounts
      const mrr = Math.max(0, baseMRR - discountAmount);

      return {
        id: item.id,
        productId,
        productName,
        price: {
          id: item.price?.id || "",
          unitAmount: item.price?.unit_amount ?? 0,
          interval:
            (item.price?.recurring?.interval as "month" | "year") || "month",
          intervalCount: item.price?.recurring?.interval_count || 1,
        },
        quantity: item.quantity ?? 0,
        baseMRR,
        mrr,
        discountAmount,
        discounts: itemDiscounts,
      };
    }
  );

  // Calculate total subscription MRR
  const baseMRR = items.reduce((total, item) => total + item.baseMRR, 0);
  const totalMRR = items.reduce((total, item) => total + item.mrr, 0);
  const totalDiscountAmount = items.reduce(
    (total, item) => total + item.discountAmount,
    0
  );

  // Determine the tier based on metadata or first product
  const tier =
    rawSubscription.metadata?.tier ||
    (items[0]?.productName || "unknown").toLowerCase();

  // Get base tier using utility function
  const baseTier = getBaseTier(tier);

  // Ensure status is one of the allowed values
  let status: "active" | "canceled" | "past_due" | "trialing" = "active";
  if (
    rawSubscription.status === "active" ||
    rawSubscription.status === "canceled" ||
    rawSubscription.status === "past_due" ||
    rawSubscription.status === "trialing"
  ) {
    status = rawSubscription.status;
  }

  return {
    id: rawSubscription.id,
    customerId,
    customerEmail,
    tier,
    baseTier,
    status,
    createdAt: rawSubscription.created,
    currentPeriodStart: rawSubscription.current_period_start,
    currentPeriodEnd: rawSubscription.current_period_end,
    cancelAtPeriodEnd: rawSubscription.cancel_at_period_end,
    rawData: rawSubscription,
    discounts: subscriptionDiscounts,
    items,
    totalMRR,
    baseMRR,
    discountAmount: totalDiscountAmount,
  };
};

/**
 * Maps all subscriptions and creates a lookup by ID
 * Filters out subscriptions with tiers listed in EXCLUDED_TIERS
 */
export const mapAllSubscriptions = (
  subscriptions: Stripe.Subscription[],
  discounts?: Stripe.Coupon[]
): Record<string, Subscription> => {
  // Create coupon map if discounts are provided
  const couponMap = discounts ? mapDiscounts(discounts) : undefined;

  // Process each subscription
  const subscriptionMap: Record<string, Subscription> = {};
  subscriptions.forEach((subscription) => {
    const processed = processSubscriptionData(subscription, couponMap);

    // Skip this subscription if its tier or baseTier is in the excluded list
    if (EXCLUDED_TIERS.length > 0) {
      const tierLower = processed.tier.toLowerCase();
      const baseTierLower = processed.baseTier.toLowerCase();

      // Check if tier is in the excluded list (case-insensitive)
      const isExcluded = EXCLUDED_TIERS.some(
        (excludedTier) =>
          excludedTier.toLowerCase() === tierLower ||
          excludedTier.toLowerCase() === baseTierLower
      );

      if (isExcluded) {
        return; // Skip adding this subscription
      }
    }

    subscriptionMap[processed.id] = processed;
  });

  return subscriptionMap;
};
