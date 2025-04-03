export const TIERS = {
  FREE: "free",
  PRO: "pro-20250202",
  TEAM: "team-20250130",
  ENTERPRISE: "enterprise",
} as const;

export type Tier = (typeof TIERS)[keyof typeof TIERS];

export function getBaseTier(tier: string): string {
  return tier.split("-")[0];
}
