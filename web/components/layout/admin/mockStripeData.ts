import type Stripe from "stripe";

/**
 * Mock Stripe subscription data for development purposes
 */
export const MOCK_SUBSCRIPTIONS: Stripe.Subscription[] = [
  {
    id: "sub_1234567890",
    object: "subscription",
    customer: "cus_12345",
    status: "active",
    current_period_start: Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60,
    current_period_end: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
    cancel_at_period_end: false,
    created: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
    items: {
      object: "list",
      data: [
        {
          id: "si_12345",
          object: "subscription_item",
          price: {
            id: "price_12345",
            object: "price",
            active: true,
            billing_scheme: "per_unit",
            created: 1609459200,
            currency: "usd",
            product: {
              id: "prod_12345",
              name: "Pro Plan",
              active: true,
              object: "product",
            } as Stripe.Product,
            recurring: {
              interval: "month",
              interval_count: 1,
              usage_type: "licensed",
            },
            type: "recurring",
            unit_amount: 4900,
          } as Stripe.Price,
          quantity: 1,
        } as Stripe.SubscriptionItem,
        {
          id: "si_67890",
          object: "subscription_item",
          price: {
            id: "price_67890",
            object: "price",
            active: true,
            billing_scheme: "per_unit",
            created: 1609459200,
            currency: "usd",
            product: {
              id: "prod_67890",
              name: "API Calls",
              active: true,
              object: "product",
            } as Stripe.Product,
            recurring: {
              interval: "month",
              interval_count: 1,
              usage_type: "licensed",
            },
            type: "recurring",
            unit_amount: 3000,
          } as Stripe.Price,
          quantity: 2,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "/v1/subscription_items?subscription=sub_1234567890",
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    metadata: {
      tier: "pro",
    },
  } as unknown as Stripe.Subscription,
  {
    id: "sub_0987654321",
    object: "subscription",
    customer: "cus_67890",
    status: "past_due",
    current_period_start: Math.floor(Date.now() / 1000) - 20 * 24 * 60 * 60,
    current_period_end: Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60,
    cancel_at_period_end: true,
    created: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60,
    items: {
      object: "list",
      data: [
        {
          id: "si_abcdef",
          object: "subscription_item",
          price: {
            id: "price_abcdef",
            object: "price",
            active: true,
            billing_scheme: "per_unit",
            created: 1609459200,
            currency: "usd",
            product: {
              id: "prod_abcdef",
              name: "Team Plan",
              active: true,
              object: "product",
            } as Stripe.Product,
            recurring: {
              interval: "month",
              interval_count: 1,
              usage_type: "licensed",
            },
            type: "recurring",
            unit_amount: 9900,
          } as Stripe.Price,
          quantity: 3,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "/v1/subscription_items?subscription=sub_0987654321",
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    metadata: {
      tier: "team",
    },
  } as unknown as Stripe.Subscription,
];

/**
 * Mock Stripe invoice data for development purposes
 */
export const MOCK_INVOICES: Stripe.Invoice[] = [
  {
    id: "in_12345",
    object: "invoice",
    subscription: "sub_1234567890",
    status: "paid",
    total: 7900,
    subtotal: 7900,
    created: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
    lines: {
      object: "list",
      data: [
        {
          id: "il_12345",
          object: "line_item",
          subscription_item: "si_12345",
          amount: 4900,
          description: "Pro Plan",
          period: {
            start: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
            end: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
          },
        } as Stripe.InvoiceLineItem,
        {
          id: "il_67890",
          object: "line_item",
          subscription_item: "si_67890",
          amount: 3000,
          description: "API Calls",
          period: {
            start: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
            end: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
          },
        } as Stripe.InvoiceLineItem,
      ],
    } as Stripe.ApiList<Stripe.InvoiceLineItem>,
  } as Stripe.Invoice,
  {
    id: "in_67890",
    object: "invoice",
    subscription: "sub_1234567890",
    status: "paid",
    total: 7900,
    subtotal: 7900,
    created: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
    lines: {
      object: "list",
      data: [
        {
          id: "il_abcdef",
          object: "line_item",
          subscription_item: "si_12345",
          amount: 4900,
          description: "Pro Plan",
          period: {
            start: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60,
            end: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
          },
        } as Stripe.InvoiceLineItem,
        {
          id: "il_ghijkl",
          object: "line_item",
          subscription_item: "si_67890",
          amount: 3000,
          description: "API Calls",
          period: {
            start: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60,
            end: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
          },
        } as Stripe.InvoiceLineItem,
      ],
    } as Stripe.ApiList<Stripe.InvoiceLineItem>,
  } as Stripe.Invoice,
];

/**
 * Mock Stripe discount data for development purposes
 */
export const MOCK_DISCOUNTS: Record<string, Stripe.Discount> = {
  di_12345: {
    id: "di_12345",
    object: "discount",
    coupon: {
      id: "25OFF",
      object: "coupon",
      percent_off: 25,
      duration: "forever",
      name: "25% Off Forever",
    } as Stripe.Coupon,
    customer: "cus_12345",
    start: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
    subscription: "sub_1234567890",
  } as Stripe.Discount,
};

/**
 * Mock Stripe upcoming invoice data for development purposes
 */
export const MOCK_UPCOMING_INVOICES: Stripe.UpcomingInvoice[] = [
  {
    id: "in_12345",
    object: "invoice",
    subscription: "sub_1234567890",
    status: "open",
    total: 7900,
    subtotal: 7900,
    created: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    due_date: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    lines: {
      object: "list",
      data: [
        {
          id: "il_12345",
          object: "line_item",
          subscription_item: "si_12345",
          amount: 4900,
          description: "Pro Plan",
          period: {
            start: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            end: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
          },
        } as Stripe.InvoiceLineItem,
      ],
      has_more: false,
      url: "/v1/invoice_items?invoice=in_12345",
    } as Stripe.ApiList<Stripe.InvoiceLineItem>,
  } as Stripe.Invoice,
];
