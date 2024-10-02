import { useOrg } from "@/components/layout/organizationContext";
import { useCallback, useMemo } from "react";

export const descriptions = {
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
  Prompts: undefined,
};

export type FeatureName = keyof typeof descriptions;

export const titles: Record<FeatureName, string> = {
  Datasets: "Unlock Datasets",
  Alerts: "Unlock Alerts",
  time_filter: "Unlock Time Filter",
  invite: "Unlock Invite",
  RateLimit: "Unlock Rate Limits",
  Prompts: "",
};

export function useProFeature(featureName: FeatureName, enabled = true) {
  const org = useOrg();

  const hasAccess = useMemo(() => {
    return (
      enabled &&
      (org?.currentOrg?.tier === "pro-20240913" ||
        org?.currentOrg?.tier === "growth" ||
        org?.currentOrg?.tier === "pro" ||
        org?.currentOrg?.tier === "enterprise" ||
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
    return org?.currentOrg?.tier === "pro-20240913";
  }, [org?.currentOrg?.tier]);

  return {
    hasAccess,
    customDescription,
    title,
    isPro,
  };
}
