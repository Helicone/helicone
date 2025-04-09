import Stripe from "stripe";

/**
 * Extracts all unique product IDs from a Stripe invoice
 */
export function getProductIdsFromInvoice(invoice: Stripe.Invoice): string[] {
  const productIds: string[] = [];

  invoice.lines?.data?.forEach((line) => {
    if (line.price?.product) {
      // Cast to string since product can be string or Stripe.Product
      const productId =
        typeof line.price.product === "string"
          ? line.price.product
          : (line.price.product as Stripe.Product).id;

      if (!productIds.includes(productId)) {
        productIds.push(productId);
      }
    }
  });

  return productIds;
}

/**
 * Extracts all unique product IDs from a Stripe upcoming invoice
 */
export function getProductIdsFromUpcomingInvoice(
  invoice: Stripe.UpcomingInvoice
): string[] {
  const productIds: string[] = [];

  invoice.lines?.data?.forEach((line) => {
    if (line.price?.product) {
      const productId =
        typeof line.price.product === "string"
          ? line.price.product
          : (line.price.product as Stripe.Product).id;

      if (!productIds.includes(productId)) {
        productIds.push(productId);
      }
    }
  });

  return productIds;
}

/**
 * Calculates the discount amount for any invoice type
 */
export function calculateDiscount(
  invoice: Stripe.Invoice | Stripe.UpcomingInvoice,
  discounts?: Record<string, Stripe.Discount>,
  productId?: string
): number {
  let discountAmount = 0;

  // If no discounts or no discount on this invoice, return 0
  if (!discounts || !invoice.discount) {
    return discountAmount;
  }

  // Get the discount details if available
  const discount = invoice.discount.id && discounts[invoice.discount.id];

  if (discount && discount.coupon) {
    const { coupon } = discount;

    // Check if discount applies to all products or specific ones
    const hasNoProductRestrictions =
      !coupon.applies_to ||
      !coupon.applies_to.products ||
      coupon.applies_to.products.length === 0;

    // If productId is specified, check if discount applies to it
    const discountAppliesToProduct =
      hasNoProductRestrictions ||
      (productId && coupon.applies_to?.products?.includes(productId));

    if (discountAppliesToProduct) {
      if (coupon.amount_off) {
        // For amount-based discounts, only apply if product-specific
        if (!hasNoProductRestrictions) {
          discountAmount = coupon.amount_off / 100;
        }
      } else if (coupon.percent_off) {
        // Always apply percentage discounts
        discountAmount = (invoice.subtotal / 100) * (coupon.percent_off / 100);
      }
    }
  }

  return discountAmount;
}
