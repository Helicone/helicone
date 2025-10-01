import {
  STRIPE_PERCENT_FEE_RATE,
  STRIPE_FIXED_FEE_CENTS,
  calculateStripeFee,
  calculateNetAmount,
  calculateGrossFromNet,
  dollarsToCents,
} from "../common/stripe/feeCalculator";

describe("Stripe Fee Calculator", () => {
  it("should have correct fee constants", () => {
    expect(STRIPE_PERCENT_FEE_RATE).toBe(0.03);
    expect(STRIPE_FIXED_FEE_CENTS).toBe(30);
  });

  it("should calculate stripe fees correctly", () => {
    // Test $100 transaction
    const amountCents = 10000;
    const fee = calculateStripeFee(amountCents, 1);
    // 3% of 10000 = 300, plus 30 cents = 330 cents
    expect(fee).toBe(330);
  });

  it("should handle multiple transactions correctly", () => {
    // Test $100 split across 2 transactions
    const grossCents = 10000;
    const fee = calculateStripeFee(grossCents, 2);
    // 3% of 10000 = 300, plus 60 cents (2 x 30) = 360 cents
    expect(fee).toBe(360);

    const net = calculateNetAmount(grossCents + fee, 2);
    expect(net).toBe(grossCents);
  });

  it("should calculate gross from net correctly", () => {
    // If we want to receive $97 net
    const netCents = 9700;
    const gross = calculateGrossFromNet(netCents, 1);
    // (9700 + 30) / 0.97 = 10030.927... rounded up to 10031
    expect(gross).toBe(10031);

    // Verify: 10031 * 0.03 = 301 (rounded up), plus 30 = 331 fee
    // 10031 - 331 = 9700 ✓
  });

  it("should convert dollars to cents correctly", () => {
    expect(dollarsToCents(100)).toBe(10000);
    expect(dollarsToCents(99.99)).toBe(9999);
    expect(dollarsToCents(0.01)).toBe(1);
  });
});
