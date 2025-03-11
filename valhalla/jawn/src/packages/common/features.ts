// Define all possible features
export const ADDON_FEATURES = [
  "evals",
  "experiments",
  "prompts",
  "datasets",
  "alerts",
] as const;
export const NON_FREE_FEATURES = ["sessions", "properties", "users"] as const;

// Create a combined type of all features
export type FeatureId =
  | (typeof ADDON_FEATURES)[number]
  | (typeof NON_FREE_FEATURES)[number];

// Define tier types
export type TierId =
  | "free"
  | "pro-20240913"
  | "pro-20250202"
  | "enterprise"
  | "demo"
  | "team-20250130";

// Define tier structure with better typing
export interface Tier {
  id: TierId;
  name: string;
  features: FeatureId[];
  trackUsage: boolean;
  // Whether this tier includes all addons by default or requires explicit addon purchases
  includesAllAddons?: boolean;
}

// Export tiers with proper typing
export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    features: [],
    trackUsage: true,
  },
  {
    id: "pro-20240913",
    name: "Pro",
    features: [...NON_FREE_FEATURES],
    trackUsage: true,
  },
  {
    id: "pro-20250202",
    name: "Pro",
    features: [...NON_FREE_FEATURES],
    trackUsage: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    features: [...NON_FREE_FEATURES, ...ADDON_FEATURES],
    trackUsage: false,
    includesAllAddons: true,
  },
  {
    id: "demo",
    name: "Demo",
    features: [...NON_FREE_FEATURES, ...ADDON_FEATURES],
    trackUsage: false,
    includesAllAddons: true,
  },
  {
    id: "team-20250130",
    name: "Team",
    features: [...NON_FREE_FEATURES, ...ADDON_FEATURES],
    trackUsage: true,
  },
];

// Define all possible subfeatures for each feature
export const SUBFEATURES = {
  prompts: ["versions"],
  experiments: ["test_cases", "variants"],
  evals: ["runs"],
  datasets: ["requests"],
} as const;

// Create a type for all possible subfeature IDs
export type SubfeatureId =
  | (typeof SUBFEATURES.prompts)[number]
  | (typeof SUBFEATURES.experiments)[number]
  | (typeof SUBFEATURES.evals)[number]
  | (typeof SUBFEATURES.datasets)[number];

// Helper functions to type check features and subfeatures
export function isFeature(feature: string): feature is FeatureId {
  return [...ADDON_FEATURES, ...NON_FREE_FEATURES].includes(feature as any);
}

export function isSubfeature(subfeature: string): subfeature is SubfeatureId {
  return Object.values(SUBFEATURES)
    .flat()
    .includes(subfeature as any);
}

// Get subfeatures for a specific feature
export function getSubfeaturesForFeature(
  feature: FeatureId
): readonly string[] {
  return (SUBFEATURES as any)[feature] || [];
}

// Create lookup table for feature display names (useful for UI)
export const FEATURE_DISPLAY_NAMES: Record<FeatureId, string> = {
  prompts: "Prompts",
  experiments: "Experiments",
  evals: "Evaluators",
  sessions: "Sessions",
  properties: "Properties",
  users: "Users",
  datasets: "Datasets",
  alerts: "Alerts",
};

// Create lookup table for subfeature display names
export const SUBFEATURE_DISPLAY_NAMES: Record<SubfeatureId, string> = {
  versions: "Versions",
  test_cases: "Test Cases",
  variants: "Variants",
  runs: "Evaluation Runs",
  requests: "Requests",
};

// Helper function to check if a tier has access to a feature
export function tierHasFeature(
  tierId: TierId,
  featureId: FeatureId,
  stripeMetadata?: { addons?: { [key in FeatureId]?: boolean } }
): boolean {
  const tier = TIERS.find((t) => t.id === tierId);

  if (!tier) return false;

  // If tier includes all addons, it has access to all features
  if (tier.includesAllAddons) return true;

  // Check if the feature is in the tier's features list
  // For addon features, check if they've been purchased
  if (ADDON_FEATURES.includes(featureId as any)) {
    // Special case for pro-20240913: grandfather in evals and experiments if they have prompts
    if (
      tierId === "pro-20240913" &&
      (featureId === "evals" || featureId === "experiments") &&
      stripeMetadata?.addons?.["prompts"]
    ) {
      return true;
    }

    // Check if the addon is enabled via stripe metadata
    return Boolean(
      stripeMetadata?.addons?.[featureId as (typeof ADDON_FEATURES)[number]]
    );
  }
  return tier.features.includes(featureId);
}
