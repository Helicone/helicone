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

export function calculateInvoiceAmounts(
  invoice: Stripe.Invoice | Stripe.UpcomingInvoice,
  discounts?: Record<string, Stripe.Discount>,
  productId?: string
): {
  amount: number;
  amountAfterDiscount: number;
} {
  // Calculate the original amount (product-specific if productId is provided)
  let amount = 0;

  if (productId) {
    // Sum only line items matching this product
    invoice.lines?.data?.forEach((line) => {
      if (line.price?.product === productId) {
        amount += (line.amount || 0) / 100;
      }
    });
  } else {
    // Full invoice amount
    const isRegularInvoice = "id" in invoice;
    if (isRegularInvoice) {
      // Regular invoice
      amount = (invoice as Stripe.Invoice).amount_paid / 100;
    } else {
      // Upcoming invoice
      amount = (invoice as Stripe.UpcomingInvoice).amount_due / 100;
    }
  }

  // Calculate the discount based on this specific amount
  let discountAmount = 0;

  if (invoice.discount) {
    const discountObj = invoice.discount;
    const { coupon } = discountObj;

    if (coupon) {
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
          if (!hasNoProductRestrictions || amount < 1000) {
            discountAmount = coupon.amount_off / 100;
          }
        } else if (coupon.percent_off) {
          // Always apply percentage discounts, even at subscription level
          discountAmount = amount * (coupon.percent_off / 100);
        }
      }
    }
  }

  // Return both values
  return {
    amount,
    amountAfterDiscount: Math.max(0, amount - discountAmount),
  };
}
