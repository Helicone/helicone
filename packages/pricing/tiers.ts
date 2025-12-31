/**
 * Pricing tier definitions for Helicone's usage-based billing
 * Used by: web/, bifrost/, and billing calculations
 */

export interface GBPricingTier {
  maxGB: number;
  ratePerGB: number;
  label: string;
}

export interface RequestPricingTier {
  maxLogs: number;
  ratePerLog: number;
  label: string;
}

// New tiered GB storage pricing (2025-12-10)
export const GB_PRICING_TIERS: GBPricingTier[] = [
  { maxGB: 30, ratePerGB: 3.25, label: "First 30 GB" },
  { maxGB: 80, ratePerGB: 2.0, label: "31-80 GB" },
  { maxGB: 200, ratePerGB: 1.25, label: "81-200 GB" },
  { maxGB: 450, ratePerGB: 0.75, label: "201-450 GB" },
  { maxGB: Infinity, ratePerGB: 0.5, label: "450+ GB" },
];

// New tiered request pricing (2025-12-10)
export const REQUEST_PRICING_TIERS: RequestPricingTier[] = [
  { maxLogs: 10_000, ratePerLog: 0, label: "First 10,000" },
  { maxLogs: 30_000, ratePerLog: 0.0007, label: "10,001-30,000" },
  { maxLogs: 90_000, ratePerLog: 0.00035, label: "30,001-90,000" },
  { maxLogs: 250_000, ratePerLog: 0.000175, label: "90,001-250,000" },
  { maxLogs: 800_000, ratePerLog: 0.0000875, label: "250,001-800,000" },
  { maxLogs: 2_500_000, ratePerLog: 0.00004375, label: "800,001-2,500,000" },
  { maxLogs: Infinity, ratePerLog: 0.00002, label: "2,500,000+" },
];

// Legacy byte-based pricing constant (for backward compatibility)
export const BYTE_PRICING = {
  ratePerGB: GB_PRICING_TIERS[0].ratePerGB,
  freeGB: 0,
};
