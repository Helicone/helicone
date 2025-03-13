import { FeatureId, FEATURE_DISPLAY_NAMES, SubfeatureId } from "./features";

export interface LimitConfig {
  getLimit: () => number;
  description: (limit: number) => string;
  upgradeFeatureName: string;
  upgradeMessage?: (limit: number, used: number) => string;
}

export interface FeatureConfig {
  main: LimitConfig;
  subfeatures?: Partial<Record<SubfeatureId, LimitConfig>>;
}

export type FreeTierConfig = {
  features: Partial<Record<FeatureId, FeatureConfig>>;
};

export const FREE_TIER_CONFIG: FreeTierConfig = {
  features: {
    prompts: {
      main: {
        getLimit: () => 3,
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
        runs: {
          getLimit: () => 10,
          description: (limit) =>
            `You can perform up to ${limit} prompt runs with the free tier`,
          upgradeMessage: (limit, used) =>
            `You've used ${used}/${limit} prompt runs. Upgrade to Prompts Tier ($50/month addon) for unlimited access.`,
          upgradeFeatureName: FEATURE_DISPLAY_NAMES.prompts,
        },
        playground_runs: {
          getLimit: () => 10,
          description: (limit) =>
            `You can perform up to ${limit} playground runs with the free tier`,
          upgradeMessage: (limit, used) =>
            `You've used ${used}/${limit} playground runs. Upgrade to Pro Tier ($20/month) for unlimited access.`,
          upgradeFeatureName: "Playground",
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
    webhooks: {
      main: {
        getLimit: () => 1,
        description: (limit) =>
          `You can create up to ${limit} webhooks with the free tier`,
        upgradeFeatureName: FEATURE_DISPLAY_NAMES.webhooks,
        upgradeMessage: (limit, used) =>
          `You've used ${used}/${limit} webhooks. Upgrade for unlimited access.`,
      },
    },
  },
};

// Utility function to get all features with free tier limits
export function getAllFeaturesWithLimits(): FeatureId[] {
  return Object.entries(FREE_TIER_CONFIG.features)
    .filter(([_, config]) => config.main.getLimit() > 0)
    .map(([key]) => key as FeatureId);
}
