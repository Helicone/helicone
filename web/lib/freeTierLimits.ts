import { Database } from "@/supabase/database.types";
import { FeatureId, FEATURE_DISPLAY_NAMES, SubfeatureId } from "./features";

// Type for context that can be passed to the limit calculation functions
export interface FreeTierLimitContext {
  organization?: Database["public"]["Tables"]["organization"]["Row"];
  userId?: string;
}

// Core limit configuration with function-based limits
export interface LimitConfig {
  // Function that calculates the limit based on context
  getLimit: (context: FreeTierLimitContext) => number;

  // Description of the limit to show in the UI
  description: (limit: number) => string;

  // Feature name for the upgrade dialog
  upgradeFeatureName: string;

  // Optional custom upgrade message
  upgradeMessage?: (limit: number, used: number) => string;
}

// A feature can have a main limit and optional subfeature limits
export interface FeatureConfig {
  main: LimitConfig;
  subfeatures?: Partial<Record<SubfeatureId, LimitConfig>>;
}

// The complete free tier configuration
export type FreeTierConfig = {
  features: Partial<Record<FeatureId, FeatureConfig>>;
};

// The actual configuration with default implementations
export const FREE_TIER_CONFIG: FreeTierConfig = {
  features: {
    prompts: {
      main: {
        getLimit: (context) => {
          // Example of context-based logic
          if (
            context.organization?.stripe_metadata &&
            typeof context.organization.stripe_metadata === "object" &&
            "earlyAccess" in context.organization.stripe_metadata &&
            context.organization.stripe_metadata.earlyAccess === true
          ) {
            return 5; // Early access users get more prompts
          }
          return 3; // Default limit
        },
        description: (limit) =>
          `You can create up to ${limit} prompts with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.prompts,
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} prompts. Upgrade for unlimited access.`,
      },
      subfeatures: {
        versions: {
          getLimit: () => 3,
          description: (limit) =>
            `You can create up to ${limit} prompt versions with the free tier`,
          upgradeMessage: (limit, used) =>
            `You've used ${used}/${limit} prompt versions. Upgrade for unlimited access.`,
          upgradeFeatureName: FEATURE_DISPLAY_NAMES.prompts,
        },
      },
    },
    experiments: {
      main: {
        getLimit: () => 3,
        description: (limit) =>
          `You can create up to ${limit} experiments with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.experiments,
      },
      subfeatures: {
        test_cases: {
          getLimit: () => 5,
          description: (limit) =>
            `You can create up to ${limit} test cases per experiment`,
          upgradeFeatureName: FEATURE_DISPLAY_NAMES.experiments,
        },
        variants: {
          getLimit: () => 3,
          description: (limit) =>
            `You can create up to ${limit} variants per experiment`,
          upgradeFeatureName: FEATURE_DISPLAY_NAMES.experiments,
          upgradeMessage: (limit, used) =>
            `You've used ${used}/${limit} variants. Upgrade for unlimited access.`,
        },
      },
    },
    evals: {
      main: {
        getLimit: () => 1,
        description: (limit) =>
          `You can create up to ${limit} evaluators with the free tier`,
        upgradeFeatureName: "evals",
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} evaluators. Upgrade for unlimited access.`,
      },
      subfeatures: {
        runs: {
          getLimit: () => 10,
          description: (limit) =>
            `You can perform up to ${limit} evaluation runs per evaluator`,
          upgradeFeatureName: "evals",
        },
      },
    },
    datasets: {
      main: {
        getLimit: () => 1,
        description: (limit) =>
          `You can create up to ${limit} datasets with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.datasets,
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} datasets. Upgrade for unlimited access.`,
      },
      subfeatures: {
        requests: {
          getLimit: () => 10,
          description: (limit) =>
            `You can add up to ${limit} requests per dataset with the free tier`,
          upgradeFeatureName: FEATURE_DISPLAY_NAMES.datasets,
          upgradeMessage: (limit, used) =>
            `You've selected ${used}/${limit} requests. Upgrade to add more requests per dataset.`,
        },
      },
    },
    alerts: {
      main: {
        getLimit: () => 1,
        description: (limit) =>
          `You can create up to ${limit} alert with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.alerts,
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} alert. Upgrade for unlimited alerts.`,
      },
    },
    sessions: {
      main: {
        getLimit: () => 1,
        description: (limit) =>
          `You can have up to ${limit} named sessions with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.sessions,
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} named sessions. Upgrade for unlimited access.`,
      },
    },
    properties: {
      main: {
        getLimit: () => 1,
        description: (limit) =>
          `You can have up to ${limit} properties with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.properties,
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} properties. Upgrade for unlimited access.`,
      },
    },
    users: {
      main: {
        getLimit: () => 3,
        description: (limit) =>
          `You can view up to ${limit} users with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.users,
        upgradeMessage: (limit, used) =>
          `You've reached the limit of ${limit} users. Upgrade for unlimited access.`,
      },
    },
  },
};

// Utility function to get all features with free tier limits
export function getAllFeaturesWithLimits(): FeatureId[] {
  return Object.entries(FREE_TIER_CONFIG.features)
    .filter(([_, config]) => config.main.getLimit({}) > 0)
    .map(([key]) => key as FeatureId);
}
