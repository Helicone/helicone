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
import { CodeExample } from "./CodeExample";
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
      variant: "bullets-cta",
      title: "",
      subtitles: [
        "Track per-user request volumes, costs, and usage patterns across your AI services.",
        "Gain detailed insights into individual user activity.",
        "Improve performance and detect potential abuse.",
      ],
      cta: {
        text: "View docs",
        link: "https://docs.helicone.ai/features/advanced-usage/user-metrics",
        variant: "outline",
      },
      media: {
        type: "image",
        src: "/static/featureUpgrade/user-metric.webp",
      },
      imageAlt: "User metrics dashboard",
    },
    datasets: {
      variant: "bullets-cta",
      title: "",
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
      cta: {
        text: "View docs",
        link: "https://docs.helicone.ai/features/fine-tuning",
        variant: "outline",
      },
    },
    properties: {
      variant: "preview-sections",
      title: "",
      subtitle:
        "Enhance your request analytics by adding custom metadata to track business metrics, user behaviors, and application-specific data points for deeper insights",
      sections: [
        {
          title: "Add custom metadata",
          description:
            "Add custom metadata to your requests with simple headers.",
          docsLink:
            "https://docs.helicone.ai/features/advanced-usage/custom-properties",
        },
        {
          title: "Analyze metadata",
          description:
            "Use this metadata to segment your data and analyze usage patterns.",
          docsLink:
            "https://docs.helicone.ai/features/advanced-usage/custom-properties",
        },
      ],
      media: {
        type: "component",
        component: () => CodeExample("properties"),
      },
      imageAlt: "Properties dashboard",
    },
    cache: {
      variant: "bullets-cta",
      title: "",
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
      cta: {
        text: "View docs",
        link: "https://docs.helicone.ai/features/advanced-usage/caching",
        variant: "outline",
      },
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
    ] as string[],
    media: {
      type: "image",
      src: "/static/featureUpgrade/sessions-small-grid.webp",
    },
    imageAlt: "Sessions and traces dashboard",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/sessions",
      variant: "outline",
    },
  },
  cache: {
    variant: "bullets-cta",
    title: "Cache Common Responses",
    subtitles: [
      "Cut costs by minimizing the number of API calls.",
      "Faster response times for common queries and reduce the load on backend resources.",
      "Find the most common requests with your app and visualize on a dashboard.",
    ] as string[],
    media: {
      type: "image",
      src: "/static/featureUpgrade/caching.webp",
    },
    imageAlt: "Cache analytics dashboard",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/advanced-usage/caching",
      variant: "outline",
    },
  },
  "rate-limits": {
    variant: "bullets-cta",
    title: "Create Custom Rate Limits",
    subtitles: [
      "Set custom LLM rate limits for your model providers.",
      "Prevent abuse of the API and excessive traffic to maintain availability for all users.",
      "Control cost and prevent unintended overuse.",
    ] as string[],
    media: {
      type: "component",
      component: RateLimitVisual,
    },
    imageAlt: "Rate limits configuration interface",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
      variant: "outline",
    },
  },
  users: {
    variant: "bullets-cta",
    title: "Track User Metrics",
    subtitles: [
      "Track per-user request volumes, costs, and usage patterns across your AI services.",
      "Gain detailed insights into individual user activity.",
      "Improve performance and detect potential abuse.",
    ] as string[],
    media: {
      type: "image",
      src: "/static/featureUpgrade/user-metric.webp",
    },
    imageAlt: "User metrics dashboard",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/advanced-usage/user-metrics",
      variant: "outline",
    },
  },
  datasets: {
    variant: "bullets-cta",
    title: "Curate High-Quality Datasets",
    subtitles: [
      "Curate datasets with your actual requests",
      "Fine-tune your LLMs to improve performance on specific tasks.",
      "Experiment with prompts to prevent regression.",
    ] as string[],
    media: {
      type: "component",
      component: DatasetVisual,
    },
    imageAlt: "Dataset curation interface",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/fine-tuning",
      variant: "outline",
    },
  },
  webhooks: {
    variant: "bullets-cta",
    title: "Automate Your Workflow With Webhooks",
    subtitles: [
      "Instantly responding to events, triggering actions, and integrating with external tools.",
      "Move data from one system to another.",
      "Score requests based on custom logic.",
    ] as string[],
    media: {
      type: "component",
      component: () => CodeExample("webhook"),
    },
    imageAlt: "Webhook code example",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/webhooks",
      variant: "outline",
    },
  },
  alerts: {
    variant: "bullets",
    title: "Set Up Real-Time Alerts",
    subtitles: [
      "Receive real-time alerts in Slack or email.",
      "Stay on top of critical issues and resolve them faster.",
    ] as string[],
    media: {
      type: "image",
      src: "/static/featureUpgrade/alerts.webp",
    },
    imageAlt: "Alert notification interface",
  },
  vault: {
    variant: "bullets-cta",
    title: "Secure Key Management",
    subtitles: [
      "Securely store and manage your API keys",
      "Create proxy keys with custom rate limits",
      "Centralized key management for your team",
    ] as string[],
    media: {
      type: "image",
      src: "/static/featureUpgrade/vault-preview.webp",
    },
    imageAlt: "Vault key management interface",
    cta: {
      text: "View docs",
      link: "https://docs.helicone.ai/features/vault",
      variant: "outline",
    },
  },
} as const satisfies Record<string, Feature>;

export type ProFeatureKey = keyof typeof PRO_FEATURES;

interface FeatureUpgradeCardProps {
  title: string;
  featureName?: FeatureName;
  featureImage?: {
    type: "image" | "component";
    content: string | React.ComponentType; // string for image URL, component for React component
  };
  headerTagline?: string;
  icon?: React.ReactNode;
  highlightedFeature?: ProFeatureKey;
}

export const FeatureUpgradeCard: React.FC<FeatureUpgradeCardProps> = ({
  title,
  featureName,
  featureImage,
  headerTagline,
  icon,
  highlightedFeature,
}) => {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { handleUpgradeTeam, isLoading } = useUpgradePlan();

  const getFeatures = () => {
    let features = { ...PRO_FEATURES };

    // Remove the highlighted feature from the general section
    if (highlightedFeature && features[highlightedFeature]) {
      const { [highlightedFeature]: _, ...remainingFeatures } = features;
      features = remainingFeatures;
    }

    return features;
  };

  const pricingCards = (
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
  );

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

        {pricingCards}
      </div>

      {featureImage && (
        <div className="w-full">
          {featureImage.type === "image" ? (
            <img
              src={featureImage.content as string}
              alt="Feature preview"
              className="w-full h-auto"
            />
          ) : (
            <div className="w-full">
              {React.createElement(featureImage.content as React.ComponentType)}
            </div>
          )}
        </div>
      )}

      {highlightedFeature && (
        <PreviewCard
          feature={
            FEATURED_SECTION_DESIGNS[highlightedFeature] ??
            PRO_FEATURES[highlightedFeature]
          }
          position="left"
          isHighlighted={true}
        />
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
