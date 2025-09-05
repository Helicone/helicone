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
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import {
  Feature,
  PreviewCard,
} from "@/components/templates/featurePreview/previewCard";
import { Button } from "@/components/ui/button";
import { H1, H2, P, Small } from "@/components/ui/typography";

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
    <div className="flex w-full flex-col gap-6 md:flex-row">
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 bg-[hsl(var(--background))] px-4 py-10 md:px-24">
      {/* Header Section */}
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col justify-between md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center">
              {icon || (
                <CircleHelpIcon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              )}
            </div>
            <Small className="text-[hsl(var(--muted-foreground))]">
              {title}
            </Small>
          </div>
          <div className="flex flex-row">
            <div className="inline-flex h-full items-center justify-center gap-2.5">
              <P className="text-[hsl(var(--muted-foreground))]">Included in</P>
              <Badge
                className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                variant="helicone"
              >
                Pro and above
              </Badge>
            </div>
          </div>
        </div>

        <H1>{headerTagline}</H1>

        {pricingCards}
      </div>

      {featureImage && (
        <div className="w-full">
          {featureImage.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featureImage.content as string}
              alt="Feature preview"
              className="h-auto w-full"
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

      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <H2>Everything else in</H2>
          <div className="inline-flex -translate-y-1 rotate-2 items-center rounded-xl border-2 border-[hsl(var(--primary))] bg-[hsl(var(--accent))] px-[18px] py-2">
            <div className="text-[hsl(var(--primary))]">Pro</div>
          </div>
        </div>

        <Button
          onClick={() => setIsUpgradeDialogOpen(true)}
          className="flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[hsl(var(--primary))] px-6 py-1.5"
        >
          <div className="text-[hsl(var(--primary-foreground))]">
            Start 7-day free trial
          </div>
        </Button>
      </div>

      <FeaturePreviewSectionClean features={getFeatures()} />

      <UpgradeProDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName={featureName}
      />
    </div>
  );
};
