"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureName } from "@/hooks/useProFeature";
import { P, Muted } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/helicone/infoBox";

export type Addons = {
  pro: boolean;
  prompts: boolean;
};

const PRO_PRICE = 79;
const TEAM_PRICE = 799;

const FEATURE_MESSAGES: Record<string, string> = {
  time_filter: "Extended time filters require Pro plan.",
  users: "Track per-user metrics and usage patterns with Pro.",
  datasets: "Advanced dataset management requires Pro upgrade.",
  prompts: "Version and manage production prompts with Pro.",
  invite: "Team member management requires Pro subscription.",
  alerts: "Real-time alert configuration needs Pro plan.",
  ratelimit: "Custom rate limits by request count or cost with Pro.",
  sessions: "Track multi-step LLM interactions with Pro.",
  properties: "Add custom metadata tags for request analysis.",
  vault: "Secure secret management requires Pro plan.",
  webhooks: "Automate workflows with LLM event webhooks.",
  playground: "Prompt testing sandbox available in Pro.",
  evaluators: "LLM performance evaluation tools with Pro.",
  experiments: "A/B test prompts at scale with Pro.",
  default:
    "Choose the plan that best fits your team. All plans include a 7-day free trial.",
};

interface UpgradeProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: FeatureName;
  limitMessage?: string;
}

export const UpgradeProDialog = ({
  open,
  onOpenChange,
  featureName,
  limitMessage,
}: UpgradeProDialogProps) => {
  const org = useOrg();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "team">("pro");

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!org?.currentOrg?.id,
  });

  const upgradeToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
          : "/v1/stripe/subscription/new-customer/upgrade-to-pro";
      const result = await jawn.POST(endpoint, {
        body: {},
      });
      return result;
    },
  });

  const upgradeToTeamBundle = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-team-bundle"
          : "/v1/stripe/subscription/new-customer/upgrade-to-team-bundle";
      const result = await jawn.POST(endpoint, {});
      return result;
    },
  });

  // Get description text with case insensitivity
  const descriptionText = featureName
    ? FEATURE_MESSAGES[featureName.toLowerCase()] || FEATURE_MESSAGES.default
    : FEATURE_MESSAGES.default;

  // Add a function to get the dialog header based on the limit info
  const getDialogHeader = () => {
    if (limitMessage) {
      return (
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-xl font-bold">
            Free Tier Limit Reached
          </DialogTitle>
          <InfoBox variant="warning" className="py-1 text-sm">
            {limitMessage}
          </InfoBox>
        </div>
      );
    }

    // Default case - standard upgrade header
    return (
      <DialogTitle className="text-xl font-bold text-foreground">
        Upgrade to Pro
      </DialogTitle>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>{getDialogHeader()}</DialogHeader>

        <DialogDescription className="text-sm">
          {descriptionText}
        </DialogDescription>

        <RadioGroup
          value={selectedPlan}
          onValueChange={(value) => setSelectedPlan(value as "pro" | "team")}
          className="flex flex-col gap-3"
        >
          {/* Pro Plan Option */}
          <label
            htmlFor="pro"
            className={`relative flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors ${
              selectedPlan === "pro"
                ? "border-primary bg-muted/50"
                : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="pro" id="pro" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <P className="font-semibold">Pro Plan</P>
                    <Muted className="text-sm">
                      Unlimited seats, tiered usage
                    </Muted>
                  </div>
                  <P className="text-lg font-bold">${PRO_PRICE}/mo</P>
                </div>

                {/* Features */}
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-primary" />
                    <Muted className="text-xs">Unlimited seats</Muted>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-primary" />
                    <Muted className="text-xs">Unlimited requests</Muted>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-primary" />
                    <Muted className="text-xs">
                      Prompts, sessions, cache & more
                    </Muted>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-primary" />
                    <Muted className="text-xs">1 month log retention</Muted>
                  </div>
                </div>
              </div>
            </div>
          </label>

          {/* Team Bundle Option */}
          <label
            htmlFor="team"
            className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              selectedPlan === "team"
                ? "border-primary bg-muted/50"
                : "hover:bg-muted/30"
            }`}
          >
            <RadioGroupItem value="team" id="team" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <P className="font-semibold">Team</P>
                  <Muted className="text-sm">For growing teams</Muted>
                </div>
                <P className="text-lg font-bold">${TEAM_PRICE}/mo</P>
              </div>

              {/* Features */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">Everything in Pro</Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">5 organizations</Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">
                    SOC-2, HIPAA compliance
                  </Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">
                    3 months retention, configurable
                  </Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">Dedicated Slack & support</Muted>
                </div>
              </div>
            </div>
          </label>
        </RadioGroup>

        <Button
          variant="action"
          className="w-full"
          onClick={async () => {
            if (selectedPlan === "team") {
              const result = await upgradeToTeamBundle.mutateAsync();
              if (result.data) {
                window.open(result.data, "_blank");
              }
            } else {
              const result = await upgradeToPro.mutateAsync();
              if (result.data) {
                window.open(result.data, "_blank");
              }
            }
          }}
          disabled={upgradeToPro.isPending || upgradeToTeamBundle.isPending}
        >
          {upgradeToPro.isPending || upgradeToTeamBundle.isPending
            ? "Loading..."
            : "Start 7-day free trial"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
