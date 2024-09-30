import { useOrg } from "@/components/layout/organizationContext";
import { UpgradeToProCTA } from "@/components/templates/pricing/upgradeToProCTA";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckIcon } from "lucide-react";
import React, { forwardRef, useCallback, useMemo, useState } from "react";

interface ProFeatureWrapperProps {
  children: React.ReactElement;
  featureName: string;
  enabled?: boolean;
  isNeedMoreRequestsPopup?: boolean;
}

const descriptions = {
  Datasets:
    "The Free plan does not include the Datasets feature, but getting access is easy.",
  Alerts:
    "Stay on top of critical issues by receiving real-time alerts directly to your Slack workspace or email. ",
  time_filter:
    "Free plan users can only access data up to 30 days old. Upgrade to Pro for unlimited access to 3m+ data.",
  invite:
    "The Free plan does not allow you to invite members to your organization. Upgrade to Pro to invite your team members.",
  RateLimit:
    "The Free plan does not allow you to set custom rate limits. Upgrade to Pro to set custom rate limits.",
};

const titles = {
  Datasets: "Unlock Datasets",
  Alerts: "Unlock Alerts",
  time_filter: "Unlock Time Filter",
  invite: "Unlock Invite",
  RateLimit: "Unlock Rate Limits",
};

export const ProFeatureWrapper = forwardRef<
  HTMLElement,
  ProFeatureWrapperProps
>(({ children, featureName, enabled = true, isNeedMoreRequestsPopup = false }, ref) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const org = useOrg();

  const customDescription = useMemo(
    () => descriptions?.[featureName as keyof typeof descriptions],
    [featureName]
  );

  const hasAccess = React.useMemo(() => {
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

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!hasAccess) {
        e.preventDefault();
        e.stopPropagation();
        setIsDialogOpen(true);
      } else if (children.props.onClick) {
        children.props.onClick(e);
      }
    },
    [hasAccess, children.props, setIsDialogOpen]
  );

  const isPro = useMemo(() => {
    return org?.currentOrg?.tier === "pro-20240913";
  }, [org?.currentOrg?.tier]);
  return (
    <>
      {React.cloneElement(children, {
        ref,
        onClick: handleClick,
        className: !hasAccess
          ? `${children.props.className || ""} `
          : children.props.className,
      })}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {titles[featureName as keyof typeof titles]}
            </DialogTitle>
            {featureName === "Alerts" && (
              <DialogDescription className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
                The Free plan does not include the Alerts feature, upgrade to Pro to enable Alerts.
              </DialogDescription>
            )}
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-4">
            {customDescription ||
              "The Free plan only comes with 10,000 requests per month, but getting more is easy."}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Free</h3>
              {!isPro && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Current plan
                </span>
              )}
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm">
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  10k free requests/month
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  Access to Dashboard
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  Free, truly
                </li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Pro</h3>
              {isPro && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Current plan
                </span>
              )}
              <span className="text-sm">$20/user</span>
              <p className="text-sm mt-2">Everything in Free, plus:</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm">
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  Limitless requests (first 100k free)
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  Access to all features
                </li>
                <li className="flex items-center text-sm">
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  Standard support
                </li>
              </ul>
              <a href="#" className="text-sm text-blue-600 mt-2 block">
                See all features →
              </a>

              <UpgradeToProCTA
                defaultPrompts={featureName === "Prompts"}
                defaultAlerts={featureName === "Alerts"}
                showAddons={
                  featureName === "Prompts" || featureName === "Alerts"
                }
              />
            </div>
          </div>
          {isNeedMoreRequestsPopup && (
            <p className="text-sm text-gray-500 mt-4">
              Don&apos;t worry, we are still processing all your incoming
              requests. You will be able to see them when you upgrade to Pro.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

ProFeatureWrapper.displayName = "ProFeatureWrapper";
