/**
 * Stripe fee calculation utilities
 * Based on Stripe's standard processing fees: 3% + $0.30 per transaction
 */

/** Stripe percentage fee rate (3%) */
export const STRIPE_PERCENT_FEE_RATE = 0.03;

/** Stripe fixed fee per transaction in cents ($0.30) */
export const STRIPE_FIXED_FEE_CENTS = 30;

/**
 * Calculate Stripe processing fees for a given amount
 * @param amountCents - The amount in cents
 * @param transactionCount - Number of transactions (default: 1)
 * @returns Total fees in cents
 */
export function calculateStripeFee(
  amountCents: number,
  transactionCount: number = 1,
): number {
  const percentageFee = Math.ceil(amountCents * STRIPE_PERCENT_FEE_RATE);
  const fixedFee = STRIPE_FIXED_FEE_CENTS * transactionCount;
  return percentageFee + fixedFee;
}

/**
 * Calculate Stripe fees in reverse
 * Given a gross amount (what was charged), calculate what the fees were
 * Formula: fee = (gross - fixed) * rate / (1 + rate) + fixed
 * This ensures: gross - fee = net, and fee = net * rate + fixed
 * @param amountCents - The gross amount in cents (what was charged)
 * @param transactionCount - Number of transactions (default: 1)
 * @returns Total fees in cents
 */
export function reverseCalculateStripeFee(
  amountCents: number,
  transactionCount: number = 1,
): number {
  const fixedFee = STRIPE_FIXED_FEE_CENTS * transactionCount;
  const percentageFee = Math.ceil(
    ((amountCents - fixedFee) * STRIPE_PERCENT_FEE_RATE) /
      (1 + STRIPE_PERCENT_FEE_RATE),
  );
  return percentageFee + fixedFee;
}

/**
 * Calculate net amount after removing Stripe fees
 * This is the actual amount received after Stripe takes their cut
 * @param grossAmountCents - The total amount charged in cents
 * @param transactionCount - Number of transactions
 * @returns Net amount in cents after fees
 */
export function calculateNetAmount(
  grossAmountCents: number,
  transactionCount: number,
): number {
  const fees = reverseCalculateStripeFee(grossAmountCents, transactionCount);
  return grossAmountCents - fees;
}

/**
 * Calculate gross amount needed to achieve a desired net amount
 * This is useful for determining how much to charge to receive a specific amount
 * @param netAmountCents - The desired net amount in cents
 * @param transactionCount - Number of transactions
 * @returns Gross amount in cents that needs to be charged
 */
export function calculateGrossFromNet(
  netAmountCents: number,
  transactionCount: number,
): number {
  // Formula: grossAmount = (netAmount + fixedFees) / (1 - percentFeeRate)
  const fixedFees = STRIPE_FIXED_FEE_CENTS * transactionCount;
  const grossAmount =
    (netAmountCents + fixedFees) / (1 - STRIPE_PERCENT_FEE_RATE);
  return Math.ceil(grossAmount);
}

/**
 * Calculate the average fee per transaction for a given total amount
 * @param totalAmountCents - The total amount in cents
 * @param transactionCount - Number of transactions
 * @returns Average fee per transaction in cents
 */
export function calculateAverageFeePerTransaction(
  totalAmountCents: number,
  transactionCount: number,
): number {
  if (transactionCount === 0) return 0;
  const totalFees = calculateStripeFee(totalAmountCents, transactionCount);
  return Math.round(totalFees / transactionCount);
}

/**
 * Format cents to dollars string
 * @param cents - Amount in cents
 * @param includeSymbol - Whether to include $ symbol
 * @returns Formatted dollar string
 */
export function formatCentsAsDollars(
  cents: number,
  includeSymbol: boolean = true,
): string {
  const dollars = cents / 100;
  const formatted = dollars.toFixed(2);
  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Convert dollars to cents
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
