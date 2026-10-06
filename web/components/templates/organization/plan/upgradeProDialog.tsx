"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FeatureName } from "@/hooks/useProFeature";
import { P } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { CONTACT_US_URL } from "@/components/templates/pricing/contactCTA";
import Link from "next/link";

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
  default: "This feature is available on paid plans.",
};

interface UpgradeProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: FeatureName;
  limitMessage?: string;
}

/**
 * Self-serve plan upgrades have been removed. This dialog now explains the
 * feature gate and points the user at the contact page instead of starting a
 * Stripe checkout.
 */
export const UpgradeProDialog = ({
  open,
  onOpenChange,
  featureName,
  limitMessage,
}: UpgradeProDialogProps) => {
  const descriptionText = featureName
    ? FEATURE_MESSAGES[featureName.toLowerCase()] || FEATURE_MESSAGES.default
    : FEATURE_MESSAGES.default;

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

        <P className="text-sm">
          Self-serve plan upgrades are no longer available. Contact us and we
          will help you get set up.
        </P>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="action" asChild>
            <Link
              href={CONTACT_US_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
