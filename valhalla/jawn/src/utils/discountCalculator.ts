import { dbExecute } from "../lib/shared/db/dbExecute";

export interface OrgDiscount {
  provider: string | null; // null = all providers
  model: string | null; // null = all models, supports regex
  percent: number; // 0-100
}

export async function getOrgDiscounts(orgId: string): Promise<OrgDiscount[]> {
  const result = await dbExecute<{ discounts: OrgDiscount[] | null }>(
    `SELECT discounts FROM organization WHERE id = $1`,
    [orgId]
  );
  return result.data?.[0]?.discounts || [];
}

export function findDiscount(
  discounts: OrgDiscount[],
  model: string,
  provider: string
): number {
  for (const rule of discounts) {
    const providerMatch = rule.provider === null || rule.provider === provider;
    const modelMatch = matchesPattern(model, rule.model);
    if (providerMatch && modelMatch) {
      return rule.percent;
    }
  }
  return 0;
}

function matchesPattern(value: string, pattern: string | null): boolean {
  if (pattern === null) return true;
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return value.toLowerCase() === pattern.toLowerCase();
  }
}
