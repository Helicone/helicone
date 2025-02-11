import React, { useState } from "react";
import { CircleHelpIcon } from "lucide-react";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName } from "@/hooks/useProFeature";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "./PricingCard";
import { FeaturePreviewSectionClean } from "@/components/templates/featurePreview/featurePreviewSectionClean";
import { RateLimitVisual } from "./RateLimitVisual";
import { DatasetVisual } from "./DatasetVisual";
import { SessionsFeatureVisual } from "./features/SessionsFeature";
import { WebhookVisual } from "./WebhookVisual";
import SimplePricingTable from "./SimplePricingTable";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import {
  Feature,
  PreviewCard,
} from "@/components/templates/featurePreview/previewCard";
import { Button } from "@/components/ui/button";

export const FEATURED_SECTION_DESIGNS: Partial<Record<ProFeatureKey, Feature>> =
  {
    sessions: {
      variant: "preview-sections",
      title: "Start tracking with headers",
      subtitle: "Track your sessions and traces with 3 simple headers.",
      sections: [
        {
          title: "Define hierarchy",
          description:
            "A simple path syntax to define parent-child relationship.",
          docsLink: "https://docs.helicone.ai/features/sessions",
        },
        {
          title: "Log everything",
          description: "Log any LLM, vector database and tool calls.",
          docsLink: "https://docs.helicone.ai/features/sessions",
        },
      ],
      media: {
        type: "component",
        component: SessionsFeatureVisual,
      },
      imageAlt: "Sessions and traces dashboard",
    },
    users: {
      variant: "preview-sections",
      title: "Track User Metrics",
      subtitle:
        "Track per-user request volumes, costs, and usage patterns across your AI services.",
      sections: [
        {
          title: "Gain detailed insights into individual user activity.",
          description: "Improve performance and detect potential abuse.",
          docsLink: "https://docs.helicone.ai/features/users",
        },
        {
          title: "Improve performance and detect potential abuse.",
          description:
            "Track per-user request volumes, costs, and usage patterns across your AI services.",
          docsLink: "https://docs.helicone.ai/features/users",
        },
      ],
      media: {
        type: "image",
        src: "/static/featureUpgrade/user-metric.webp",
      },
      imageAlt: "User metrics dashboard",
    },
  };

export const PRO_FEATURES: Record<string, Feature> = {
  sessions: {
    variant: "bullets-cta",
    title: "Track Sessions and Traces",
    subtitles: [
      "Track your sessions and traces with 3 simple headers",
      "Define parent-child relationships with simple path syntax",
      "Log any LLM, vector database and tool calls",
    ],
    media: {
      type: "image",
      src: "/static/featureUpgrade/sessions-small-grid.webp",
    },
    imageAlt: "Sessions and traces dashboard",
    cta: {
      text: "Learn more",
      link: "https://docs.helicone.ai/features/sessions",
    },
  },
  cache: {
    variant: "bullets",
    title: "Cache Common Responses",
    subtitles: [
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
  "rate-limits": {
    variant: "bullets",
    title: "Create Custom Rate Limits",
    subtitles: [
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
  users: {
    variant: "bullets",
    title: "Track User Metrics",
    subtitles: [
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
  datasets: {
    variant: "bullets",
    title: "Curate High-Quality Datasets",
    subtitles: [
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
  webhooks: {
    variant: "bullets",
    title: "Automate Your Workflow With Webhooks",
    subtitles: [
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
  alerts: {
    variant: "bullets",
    title: "Set Up Real-Time Alerts",
    subtitles: [
      "Receive real-time alerts in Slack or email.",
      "Stay on top of critical issues and resolve them faster.",
    ],
    media: {
      type: "image",
      src: "/static/featureUpgrade/alerts.webp",
    },
    imageAlt: "Alert notification interface",
  },
} as const;

export type ProFeatureKey = keyof typeof PRO_FEATURES;

interface FeatureUpgradeCardProps {
  title: string;
  featureName?: FeatureName;
  featureImage?: string;
  headerTagline?: string;
  icon?: React.ReactNode;
  highlightedFeature?: ProFeatureKey;
  featureOrder?: ProFeatureKey[];
}

export const FeatureUpgradeCard: React.FC<FeatureUpgradeCardProps> = ({
  title,
  featureName,
  featureImage,
  headerTagline,
  icon,
  highlightedFeature,
  featureOrder,
}) => {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { handleUpgradeTeam, isLoading } = useUpgradePlan();

  const getFeatures = () => {
    if (featureOrder) {
      return Object.fromEntries(
        featureOrder.map((key) => [key, PRO_FEATURES[key]])
      );
    }
    return PRO_FEATURES;
  };

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
                Included in
              </div>
              <Badge
                className="bg-slate-100 text-slate-500 text-sm"
                variant="helicone"
              >
                Pro and above
              </Badge>
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

      {highlightedFeature && (
        <>
          {featureImage && (
            <div className="w-full">
              <img
                src={featureImage}
                alt="Feature preview"
                className="w-full h-auto"
              />
            </div>
          )}

          <PreviewCard
            feature={
              FEATURED_SECTION_DESIGNS[highlightedFeature] ??
              PRO_FEATURES[highlightedFeature]
            }
            position="left"
            isHighlighted={true}
          />
        </>
      )}

      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-4xl font-semibold leading-[52px] tracking-tight text-[#031727]">
          <span>Everything else in</span>
          <div className="px-[18px] py-2 -translate-y-1 rotate-2 bg-[#e7f6fd] rounded-xl border-2 border-[#0ca5ea] inline-flex items-center">
            <div className="text-[#0ca5ea] text-3xl font-semibold leading-9">
              Pro
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsUpgradeDialogOpen(true)}
          className="h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl flex justify-center items-center gap-2.5"
        >
          <div className="text-white text-lg font-bold leading-normal tracking-tight">
            Start 7-day free trial
          </div>
        </Button>
      </div>

      <FeaturePreviewSectionClean features={getFeatures()} />

      <SimplePricingTable />

      <UpgradeProDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName={featureName}
      />
    </div>
  );
};
