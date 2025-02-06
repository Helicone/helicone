import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo } from "react";

export const descriptions = {
  pro: "Get unlimited usage, sessions, user analytics, custom properties and much more with Pro.",
  Datasets:
    "The Free plan does not include the Datasets feature, but getting access is easy.",
  Alerts:
    "Stay on top of critical issues by receiving real-time alerts directly to your Slack workspace or email.",
  time_filter:
    "Free plan users can only access data up to 30 days old. Upgrade to Pro for unlimited access up to 3m data.",
  invite:
    "The Free plan does not allow you to invite members to your organization. Upgrade to Pro to invite your team members.",
  RateLimit:
    "The Free plan does not allow you to set custom rate limits. Upgrade to Pro to set custom rate limits.",
  Properties:
    "The Free plan does not allow you to set custom properties. Upgrade to Pro to set custom properties.",
  Prompts:
    "The Free plan does not allow you to use prompt management. Upgrade to Pro to use prompt management.",
  cache:
    "The Free plan does not allow you to use cache. Upgrade to Pro to use cache.",
  Evaluators:
    "The Free plan does not allow you to set custom evaluators. Upgrade to Pro to set custom evaluators.",
  Playground:
    "The Free plan does not allow you to use the Playground. Upgrade to Pro to use the Playground.",
  Sessions:
    "The Free plan does not allow you to use the Sessions. Upgrade to Pro to use the Sessions.",
  Vault:
    "The Free plan does not allow you to use the Vault. Upgrade to Pro to use the Vault.",
  Webhooks:
    "The Free plan does not allow you to use the Webhooks. Upgrade to Pro to use the Webhooks.",
  Users:
    "The Free plan does not allow you to use the Users. Upgrade to Pro to use the Users.",
};

export type FeatureName = keyof typeof descriptions;

export const titles: Record<FeatureName, string> = {
  pro: "Unlock Pro",
  Datasets: "Unlock Datasets",
  Alerts: "Unlock Alerts",
  time_filter: "Unlock Time Filter",
  invite: "Unlock Invite",
  RateLimit: "Unlock Rate Limits",
  Properties: "Unlock Properties",
  Prompts: "Unlock Prompts",
  cache: "Unlock Cache",
  Evaluators: "Unlock Evaluators",
  Playground: "Unlock Playground",
  Sessions: "Unlock Sessions",
  Vault: "Unlock Vault",
  Webhooks: "Unlock Webhooks",
  Users: "Unlock Users",
};

export function useProFeature(featureName: FeatureName, enabled = true) {
  const org = useOrg();

  const hasAccess = useMemo(() => {
    return (
      enabled &&
      (org?.currentOrg?.tier === "pro-20240913" ||
        org?.currentOrg?.tier === "pro-20250202" ||
        org?.currentOrg?.tier === "growth" ||
        org?.currentOrg?.tier === "pro" ||
        org?.currentOrg?.tier === "enterprise" ||
        org?.currentOrg?.tier === "demo" ||
        (org?.currentOrg?.stripe_metadata as { addons?: { prompts?: boolean } })
          ?.addons?.prompts)
    );
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, enabled]);

  const customDescription = useMemo(
    () => descriptions[featureName],
    [featureName]
  );

  const title = useMemo(() => titles[featureName], [featureName]);

  const isPro = useMemo(() => {
    return (
      org?.currentOrg?.tier === "pro-20240913" ||
      org?.currentOrg?.tier === "pro-20250202"
    );
  }, [org?.currentOrg?.tier]);

  return {
    hasAccess,
    customDescription,
    title,
    isPro,
  };
}
