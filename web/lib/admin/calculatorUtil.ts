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
  invoice: Stripe.UpcomingInvoice,
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
  productId?: string,
  priceFilter?: { include?: string[]; exclude?: string[] },
): {
  amount: number;
  amountAfterProcessing: number;
  refundAmount: number;
} {
  // Calculate the original amount (product-specific if productId is provided)
  let amount = 0;

  if (productId) {
    // Sum only line items matching this product (and price filter if provided)
    invoice.lines?.data?.forEach((line) => {
      if (line.price?.product === productId) {
        const priceId = line.price?.id;
        // Apply price filter if provided
        if (priceFilter) {
          if (priceFilter.include && priceId && !priceFilter.include.includes(priceId)) {
            return; // Skip if not in include list
          }
          if (priceFilter.exclude && priceId && priceFilter.exclude.includes(priceId)) {
            return; // Skip if in exclude list
          }
        }
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

  // Handle both single discount and multiple discounts
  const discountsToApply: Stripe.Discount[] = [];

  if (invoice.discount) {
    // Single discount case
    discountsToApply.push(invoice.discount);
  }

  if (invoice.discounts && invoice.discounts.length > 1) {
    // Multiple discounts case - can be array of IDs or objects
    if (Array.isArray(invoice.discounts)) {
      invoice.discounts.forEach((discount) => {
        // Skip deleted discounts
        if (typeof discount === "object" && "deleted" in discount) {
          return; // Skip this iteration
        }

        // If it's a string (discount ID), look it up in the discounts parameter
        if (typeof discount === "string" && discounts && discounts[discount]) {
          discountsToApply.push(discounts[discount]);
        }
        // If it's a Discount object, use it directly
        else if (typeof discount === "object" && "id" in discount) {
          discountsToApply.push(discount as Stripe.Discount);
        }
      });
    }
  }

  // Apply each discount - loop over our collected valid discount objects
  discountsToApply.forEach((discountObj) => {
    const { coupon } = discountObj;

    if (coupon) {
      // Check if discount applies to specific products
      const hasProductRestrictions =
        coupon.applies_to &&
        coupon.applies_to.products &&
        coupon.applies_to.products.length > 0;

      // If productId is specified, check if discount applies to it
      const discountAppliesToProduct =
        !hasProductRestrictions ||
        (productId && coupon.applies_to?.products?.includes(productId));

      if (discountAppliesToProduct) {
        if (coupon.amount_off) {
          // For amount-based discounts, only apply if product-specific
          if (
            hasProductRestrictions ||
            amount < 1000 ||
            coupon.amount_off > 1000
          ) {
            discountAmount += coupon.amount_off / 100;
          }
        } else if (coupon.percent_off) {
          // Always apply percentage discounts, even at subscription level
          discountAmount += amount * (coupon.percent_off / 100);
        }
      }
    }
  });

  // Calculate refund amount if available
  let refundAmount = 0;

  // Check if this is a regular invoice with an expanded charge
  if ("charge" in invoice && invoice.charge) {
    // If charge is expanded to an object with refunds
    if (typeof invoice.charge !== "string" && invoice.charge.refunds) {
      refundAmount = (invoice.charge.amount_refunded || 0) / 100;
    }
  }

  // Return values - calculate final amount after both discounts and refunds
  return {
    amount,
    amountAfterProcessing: Math.max(0, amount - discountAmount - refundAmount),
    refundAmount,
  };
}
