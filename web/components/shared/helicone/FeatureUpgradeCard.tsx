import React, { useState } from "react";
import { CircleHelpIcon } from "lucide-react";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName } from "@/hooks/useProFeature";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "./PricingCard";
import { FeaturePreviewSectionClean } from "@/components/templates/featurePreview/featurePreviewSectionClean";
import { RateLimitVisual } from "./RateLimitVisual";
import { DatasetVisual } from "./DatasetVisual";
import {
  SessionsFeatureText,
  SessionsFeatureVisual,
} from "./features/SessionsFeature";
import { WebhookVisual } from "./WebhookVisual";
import SimplePricingTable from "./SimplePricingTable";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";

interface FeatureUpgradeCardProps {
  title: string;
  featureName?: FeatureName;
  featureImage?: string;
  headerTagline?: string;
  icon?: React.ReactNode;
}

export const FeatureUpgradeCard: React.FC<FeatureUpgradeCardProps> = ({
  title,
  featureName,
  featureImage,
  headerTagline,
  icon,
}) => {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { handleUpgradeTeam, isLoading } = useUpgradePlan();

  return (
    <div className="w-full max-w-7xl md:px-24 px-4 mx-auto py-10 bg-white flex flex-col gap-16">
      {/* Header Section */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 flex items-center justify-center">
              {icon || <CircleHelpIcon className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="text-center text-slate-500 text-md font-medium leading-normal">
              {title}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="h-full justify-center items-center gap-2.5 inline-flex">
              <div className="opacity-70 text-slate-500 text-lg font-normal leading-normal">
                Unlock with
              </div>
              <div className="justify-start items-center gap-2 flex">
                <Badge
                  className="bg-slate-100 text-slate-500 text-sm"
                  variant="helicone"
                >
                  Pro
                </Badge>
                <Badge
                  className="bg-slate-100 text-slate-500 text-sm"
                  variant="helicone"
                >
                  Team
                </Badge>
                <Badge
                  className="bg-slate-100 text-slate-500 text-sm"
                  variant="helicone"
                >
                  Enterprise
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="text-black text-3xl font-semibold leading-normal">
          {headerTagline}
        </div>

        <div className="w-full flex md:flex-row gap-6 flex-col">
          <PricingCard title="Hobby" price="Free" isCurrentPlan={true} />
          <PricingCard
            title="Pro"
            price="$20"
            priceSubtext="/seat/mo"
            isPopular={true}
            variant="highlighted"
            onClick={() => setIsUpgradeDialogOpen(true)}
          />
          <PricingCard
            title="Team"
            price="$200"
            priceSubtext="/mo"
            isBestValue={true}
            variant="outlined"
            onClick={handleUpgradeTeam}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="w-full">
        <img
          src={featureImage}
          alt="Feature preview"
          className="w-full h-auto"
        />
      </div>

      <FeaturePreviewSectionClean
        features={[
          {
            title: "Track Your Sessions and Traces",
            description: ["", "", ""],
            media: {
              type: "component",
              component: SessionsFeatureVisual,
            },
            imageAlt: "Sessions and traces dashboard",
            CustomTextComponent: SessionsFeatureText,
          },
          {
            title: "Cache Common Responses",
            description: [
              "Cut costs by minimizing the number of API calls.",
              "Faster response times for common queries and reduce the load on backend resources.",
              "Find the most common requests with your app and visualize on a dashboard.",
            ],
            media: {
              type: "image",
              src: "/static/featureUpgrade/caching.webp",
            },
            imageAlt: "Cache analytics dashboard",
          },
          {
            title: "Create Custom Rate Limits",
            description: [
              "Set custom LLM rate limits for your model providers.",
              "Prevent abuse of the API and excessive traffic to maintain availability for all users.",
              "Control cost and prevent unintended overuse.",
            ],
            media: {
              type: "component",
              component: RateLimitVisual,
            },
            imageAlt: "Rate limits configuration interface",
          },
          {
            title: "Track User Metrics",
            description: [
              "Track per-user request volumes, costs, and usage patterns across your AI services.",
              "Gain detailed insights into individual user activity.",
              "Improve performance and detect potential abuse.",
            ],
            media: {
              type: "image",
              src: "/static/featureUpgrade/user-metric.webp",
            },
            imageAlt: "User metrics dashboard",
          },
          {
            title: "Curate High-Quality Datasets",
            description: [
              "Curate datasets with your actual requests",
              "Fine-tune your LLMs to improve performance on specific tasks.",
              "Experiment with prompts to prevent regression.",
            ],
            media: {
              type: "component",
              component: DatasetVisual,
            },
            imageAlt: "Dataset curation interface",
          },
          {
            title: "Automate Your Workflow With Webhooks",
            description: [
              "Instantly responding to events, triggering actions, and integrating with external tools.",
              "Move data from one system to another.",
              "Score requests based on custom logic.",
            ],
            media: {
              type: "component",
              component: WebhookVisual,
            },
            imageAlt: "Webhook code example",
          },
          {
            title: "Set Up Real-Time Alerts",
            description: [
              "Receive real-time alerts in Slack or email.",
              "Stay on top of critical issues and resolve them faster.",
            ],
            media: {
              type: "image",
              src: "/static/featureUpgrade/alerts.webp",
            },
            imageAlt: "Alert notification interface",
          },
        ]}
      />

      <SimplePricingTable />

      <UpgradeProDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName={featureName}
      />
    </div>
  );
};
