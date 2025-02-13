import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
import { CodeExample } from "./CodeExample";

interface EmptyStateFeature {
  title: string;
  description: string;
  featureImage: {
    type: "image" | "component" | "video";
    content: string | React.ComponentType;
  };
  cta?: {
    primary?: {
      text: string;
      link: string;
    };
    secondary?: {
      text: string;
      link: string;
    };
  };
}

// Feature definitions
export const EMPTY_STATE_FEATURES: Record<string, EmptyStateFeature> = {
  sessions: {
    title: "No Sessions Data Yet",
    description:
      "Group and visualize multi-step LLM interactions. Track request flows across multiple traces and gain insights into complex AI workflows by adding only 2 simple headers.",
    featureImage: {
      type: "component",
      content: () => (
        <DiffHighlight
          code={`"Helicone-Session-Id": "chat-123",       // Unique identifier for the session
"Helicone-Session-Path": "/parent/child",  // Hierarchical path for trace relationships 
"Helicone-Session-Name": "Customer Support Flow"  // Human-readable session name`}
          language={"javascript"}
          newLines={[]}
          oldLines={[]}
          minHeight={false}
          maxHeight={false}
          textSize="md"
          className="rounded-lg"
          marginTop={false}
        />
      ),
    },
    cta: {
      //   primary: {
      //     text: "Get Started",
      //     link: "https://docs.helicone.ai/features/sessions",
      //   },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/sessions",
      },
    },
  },
  cache: {
    title: "No Cached Responses Yet",
    description:
      "Start caching responses to reduce costs and improve response times.",
    featureImage: {
      type: "image",
      content: "/static/featureUpgrade/caching.webp",
    },
    cta: {
      primary: {
        text: "Get Started",
        link: "https://docs.helicone.ai/features/advanced-usage/caching",
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/caching",
      },
    },
  },
  "rate-limits": {
    title: "No Rate Limits Set",
    description:
      "Set up custom rate limits to control costs and prevent abuse.",
    featureImage: {
      type: "image",
      content: "/static/featureUpgrade/rate-limits.webp",
    },
    cta: {
      primary: {
        text: "Get Started",
        link: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
      },
    },
  },
  users: {
    title: "No User Metrics Yet",
    description:
      "Start tracking per-user request volumes and usage patterns with a simple header.",
    featureImage: {
      type: "component",
      content: () => CodeExample("users"),
    },
    cta: {
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/user-metrics",
      },
    },
  },
  properties: {
    title: "No properties created yet",
    description: "Attach custom metadata to your requests with simple headers.",
    featureImage: {
      type: "component",
      content: () => (
        <DiffHighlight
          code={`"Helicone-Property-UserType": "premium",
"Helicone-Property-Feature": "content_generation",
"Helicone-Property-Department": "marketing",
"Helicone-Property-Region": "north_america",
"Helicone-Property-UseCase": "email_campaign"`}
          language={"javascript"}
          newLines={[]}
          oldLines={[]}
          minHeight={false}
          maxHeight={false}
          textSize="md"
          className="rounded-lg "
          marginTop={false}
        />
      ),
    },
    cta: {
      //   primary: {
      //     text: "Go to requests",
      //     link: "/requests",
      //   },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/custom-properties",
      },
    },
  },
  datasets: {
    title: "No datasets created yet",
    description: "Head to the request page to create your first dataset.",
    featureImage: {
      type: "video",
      content:
        "https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/datasets-empty-state.mp4",
    },
    cta: {
      primary: {
        text: "Go to requests",
        link: "/requests",
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/fine-tuning",
      },
    },
  },
  webhooks: {
    title: "No Webhooks Configured",
    description:
      "Set up webhooks to automate your workflow and integrate with external tools.",
    featureImage: {
      type: "image",
      content: "/static/featureUpgrade/webhooks.webp",
    },
    cta: {
      primary: {
        text: "Get Started",
        link: "https://docs.helicone.ai/features/webhooks",
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/webhooks",
      },
    },
  },
  alerts: {
    title: "No Alerts Configured",
    description: "Set up real-time alerts to stay on top of critical issues.",
    featureImage: {
      type: "image",
      content: "/static/featureUpgrade/alerts.webp",
    },
    cta: {
      primary: {
        text: "Get Started",
        link: "https://docs.helicone.ai/features/alerts",
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/alerts",
      },
    },
  },
} as const;

export type EmptyStateFeatureKey = keyof typeof EMPTY_STATE_FEATURES;

export const EmptyStateCard: React.FC<{ feature: EmptyStateFeatureKey }> = ({
  feature,
}) => {
  const featureDefaults = feature
    ? EMPTY_STATE_FEATURES[feature]
    : ({
        title: "No Data Available",
        description:
          "Start sending requests through Helicone to see your analytics here.",
        featureImage: {
          type: "image",
          content: "/static/empty-state-default.webp",
        },
        cta: {
          primary: {
            text: "Get Started",
            link: "https://docs.helicone.ai/getting-started",
          },
          secondary: {
            text: "View Docs",
            link: "https://docs.helicone.ai/getting-started",
          },
        },
      } as EmptyStateFeature);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center max-w-7xl md:px-24 px-4 mx-auto py-14 flex flex-col gap-16">
      <div className="flex flex-col gap-6 items-center text-center">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-semibold text-slate-900">
            {featureDefaults?.title}
          </h3>
          <p className="text-slate-500 text-lg max-w-2xl">
            {featureDefaults?.description}
          </p>
        </div>

        <div className="flex flex-row gap-2">
          {featureDefaults?.cta?.primary && (
            <Link
              href={featureDefaults?.cta?.primary?.link ?? ""}
              target="_blank"
            >
              <Button variant="action" className="gap-2">
                {featureDefaults?.cta?.primary?.text}
                <SquareArrowOutUpRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {featureDefaults?.cta?.secondary && (
            <Link
              href={featureDefaults?.cta?.secondary?.link ?? ""}
              target="_blank"
            >
              <Button variant="outline" className="gap-2">
                {featureDefaults?.cta?.secondary?.text}
                <SquareArrowOutUpRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {featureDefaults?.featureImage &&
        (featureDefaults.featureImage.type === "video" ? (
          <div className="max-w-6xl overflow-hidden relative border-2 border-slate-200 rounded-lg object-contain">
            <video
              className="w-full max-h-[500px] object-contain"
              src={featureDefaults.featureImage.content as string}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </div>
        ) : featureDefaults.featureImage.type === "component" ? (
          <div className="w-full max-w-2xl">
            {React.createElement(
              featureDefaults.featureImage.content as React.ComponentType
            )}
          </div>
        ) : (
          <img
            src={featureDefaults.featureImage.content as string}
            alt={featureDefaults.title}
            className="w-full max-w-2xl  xl:max-w-6xl h-auto rounded-lg"
          />
        ))}
    </div>
  );
};
