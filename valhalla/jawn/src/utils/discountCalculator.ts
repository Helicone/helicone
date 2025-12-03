import { dbExecute } from "../lib/shared/db/dbExecute";

// Discount rule stored in organization.discounts JSONB
export interface OrgDiscount {
  provider: string | null; // null = all providers
  model: string | null; // null = all models, supports wildcards like "gpt-%"
  percent: number; // e.g., 10 = 10% off
}

/**
 * Default discounts applied when org has none configured.
 * TODO: Remove once all orgs have discounts configured in DB.
 */
const DEFAULT_DISCOUNTS: OrgDiscount[] = [
  { provider: "helicone", model: "gpt%", percent: 10 },
  { provider: "helicone", model: "claude-%", percent: 15 },
  { provider: "helicone", model: "grok-%", percent: 5 },
];

export interface SpendItem {
  model: string;
  provider: string;
  costUsd: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface DiscountedSpendItem extends SpendItem {
  subtotal: number; // Cost before discount (USD)
  discountPercent: number; // 0-100
  total: number; // Cost after discount (USD)
}

/**
 * Handles organization discount calculations.
 * Used by both credits breakdown (public) and admin invoicing flows.
 */
export class DiscountCalculator {
  constructor(private discounts: OrgDiscount[]) {}

  /**
   * Create a DiscountCalculator for a specific organization.
   * Fetches discount rules from the organization's discounts JSONB column.
   * Falls back to DEFAULT_DISCOUNTS if org has none configured.
   */
  static async forOrg(orgId: string): Promise<DiscountCalculator> {
    const result = await dbExecute<{ discounts: OrgDiscount[] | null }>(
      `SELECT discounts FROM organization WHERE id = $1`,
      [orgId]
    );

    const orgDiscounts = result.data?.[0]?.discounts;
    // Use org's discounts if configured, otherwise fall back to defaults
    const discounts: OrgDiscount[] =
      orgDiscounts && orgDiscounts.length > 0
        ? orgDiscounts
        : DEFAULT_DISCOUNTS;

    return new DiscountCalculator(discounts);
  }

  /**
   * Check if a model matches a pattern (supports SQL LIKE-style % wildcards)
   * Examples:
   *   - "gpt%" matches "gpt-4", "gpt-4o", "gpt-3.5-turbo"
   *   - "claude-%" matches "claude-3.5-sonnet", "claude-3-opus"
   *   - null matches everything
   */
  matchesPattern(value: string, pattern: string | null): boolean {
    if (pattern === null) return true; // null matches everything
    // Convert SQL LIKE pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except %
      .replace(/%/g, ".*"); // Convert % to .*
    return new RegExp(`^${regexPattern}$`, "i").test(value);
  }

  /**
   * Find the first matching discount rule for a model/provider combination.
   * Rules are evaluated in order; first match wins.
   * @returns The discount percentage (0-100), or 0 if no match
   */
  findDiscount(model: string, provider: string): number {
    for (const rule of this.discounts) {
      const providerMatch =
        rule.provider === null || rule.provider === provider;
      const modelMatch = this.matchesPattern(model, rule.model);
      if (providerMatch && modelMatch) {
        return rule.percent;
      }
    }
    return 0;
  }

  /**
   * Apply discounts to a list of spend items.
   * Returns items with subtotal (pre-discount), discountPercent, and total (post-discount).
   */
  applyDiscounts(items: SpendItem[]): DiscountedSpendItem[] {
    return items.map((item) => {
      const subtotal = item.costUsd;
      const discountPercent = this.findDiscount(item.model, item.provider);
      const total = subtotal * (1 - discountPercent / 100);

      return {
        ...item,
        subtotal,
        discountPercent,
        total,
      };
    });
  }

  /**
   * Calculate the total cost after applying discounts.
   */
  calculateTotal(items: SpendItem[]): number {
    return this.applyDiscounts(items).reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Get the discount rules for debugging/display.
   */
  getDiscounts(): OrgDiscount[] {
    return this.discounts;
  }

  /**
   * Check if any discounts are configured.
   */
  hasDiscounts(): boolean {
    return this.discounts.length > 0;
  }
}
