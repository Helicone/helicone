import { Button } from "@/components/ui/button";
import { H2, P } from "@/components/ui/typography";
import {
  Archive,
  Bell,
  Database,
  GitBranch,
  Layers,
  Plus,
  Shield,
  SquareArrowOutUpRight,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createHighlighter } from "shiki";

// Create a singleton highlighter instance
const highlighterPromise = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "python", "bash", "http", "plaintext", "sql"],
});

interface EmptyStateFeature {
  title: string;
  description: string;
  icon?: React.ElementType;
  featureImage: {
    type: "image" | "video" | "code" | "none";
    content: string;
    language?: string;
    maxWidth?: string;
  };
  cta?: {
    primary?: {
      text: string;
      link?: string;
      onClick?: boolean;
      showPlusIcon?: boolean;
    };
    secondary?: {
      text: string;
      link: string;
    };
  };
}

// Feature definitions with consistent structure
export const EMPTY_STATE_FEATURES: Record<string, EmptyStateFeature> = {
  prompts: {
    title: "Create Your First Prompt",
    description:
      "Design, version, and deploy prompts through the AI Gateway. No code changes needed.",
    icon: Tag,
    featureImage: {
      type: "code",
      content: `// Deploy your prompt template through the AI Gateway
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  prompt_id: "customer-support",
  inputs: {
    customer_name: "Sarah",
    issue: "refund request",
    sentiment: "frustrated"
  }
});`,
      language: "typescript",
      maxWidth: "2xl",
    },
    cta: {
      primary: {
        text: "Create First Prompt",
        onClick: true,
        showPlusIcon: true,
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/prompts",
      },
    },
  },
  sessions: {
    title: "Track Your First Session",
    description:
      "To start tracking your agentic workflow, simply add these headers:",
    icon: Layers,
    featureImage: {
      type: "code",
      content: `Helicone-Session-Id: chat-123
Helicone-Session-Path: /parent/child 
Helicone-Session-Name: Customer Support Flow`,
      language: "http",
    },
    cta: {
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/sessions",
      },
    },
  },
  cache: {
    title: "Cache Common Responses",
    description:
      "Caching reduces API costs and improve response times. Control cache behaviors using these parameters:",
    icon: Archive,
    featureImage: {
      type: "code",
      content: `Helicone-Cache-Enabled: "true",         // Required to enable caching
Cache-Control: "max-age=3600",          // Optional: Cache duration
Helicone-Cache-Bucket-Max-Size: "1000", // Optional: Max entries per bucket
Helicone-Cache-Seed: "user-123"         // Optional: Isolate cache by seed`,
      language: "http",
      maxWidth: "2xl",
    },
    cta: {
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/caching",
      },
    },
  },
  "rate-limits": {
    title: "Configure Your Rate Limits",
    description:
      "Requests will appear here once they hit your configured limits. Monitor your API usage with 1 simple header:",
    icon: Shield,
    featureImage: {
      type: "code",
      content: `Helicone-RateLimit-Policy: "[quota];w=[time_window];u=[unit];s=[segment]"`,
      language: "http",
      maxWidth: "3xl",
    },
    cta: {
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
      },
      primary: {
        text: "Create Rate Limit",
        onClick: true,
        showPlusIcon: true,
      },
    },
  },
  users: {
    title: "Start Tracking User Metrics",
    description:
      "Start tracking per-user request volumes and usage patterns with a simple header:",
    icon: User,
    featureImage: {
      type: "code",
      content: `Helicone-User-Id: john@doe.com`,
      language: "http",
    },
    cta: {
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/user-metrics",
      },
    },
  },
  properties: {
    title: "Create Your First Custom Property",
    description:
      "Add custom metadata to your requests. Track metrics and user behaviors for deeper insights.",
    icon: Tag,
    featureImage: {
      type: "code",
      content: `Helicone-Property-UserType: premium
Helicone-Property-Feature: content_generation
Helicone-Property-Department: marketing
Helicone-Property-Region: north_america
Helicone-Property-UseCase: email_campaign`,
      language: "http",
    },
    cta: {
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/custom-properties",
      },
    },
  },
  datasets: {
    title: "Create Your First Dataset",
    description:
      "Curate your dataset from requests data to fine-tune LLMs or test prompts. ",
    icon: GitBranch,
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
    icon: GitBranch,
    featureImage: {
      type: "none",
      content: "",
    },
    cta: {
      primary: {
        text: "Add Webhook",
        onClick: true,
        showPlusIcon: true,
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/webhooks",
      },
    },
  },
  alerts: {
    title: "Create Your First Alert",
    description:
      "Receive real-time notifications in Slack or via email when something goes wrong.",
    icon: Bell,
    featureImage: {
      type: "none",
      content: "",
    },
    cta: {
      primary: {
        text: "Create Alert",
        onClick: true,
        showPlusIcon: true,
      },
    },
  },
  hql: {
    title: "Request Access to HQL",
    description:
      "Query your Helicone data with HQL (Helicone Query Language). Analyze requests, tokens, costs, and custom properties across your entire LLM usage.",
    icon: Database,
    featureImage: {
      type: "code",
      content: `-- Find your most expensive requests in the last 7 days
SELECT 
  request_created_at,
  request_model,
  response_body,
  provider_total_cost
FROM request_response_rmt
WHERE request_created_at > now() - INTERVAL 7 DAY
ORDER BY provider_total_cost DESC
LIMIT 100`,
      language: "sql",
      maxWidth: "2xl",
    },
    cta: {
      primary: {
        text: "Request Access",
        onClick: true,
        showPlusIcon: false,
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/hql",
      },
    },
  },
} as const;

export type EmptyStateFeatureKey = keyof typeof EMPTY_STATE_FEATURES;

export interface EmptyStateCardProps {
  feature: keyof typeof EMPTY_STATE_FEATURES;
  onPrimaryClick?: () => void;
}

// Custom component for Shiki highlighted code
const ShikiHighlightedCode: React.FC<{
  code: string;
  language: string;
  maxWidth?: string;
}> = ({ code, language, maxWidth = "xl" }) => {
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  useEffect(() => {
    const highlightCode = async () => {
      const highlighter = await highlighterPromise;
      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme: "github-dark",
      });
      // Apply custom CSS to override any center alignment and add rounded corners
      const formattedHtml = html.replace(
        /<pre class="shiki"/,
        '<pre class="shiki rounded-lg" style="text-align: left;"',
      );
      setHighlightedCode(formattedHtml);
    };

    highlightCode();
  }, [code, language]);

  return (
    <div className="w-full overflow-hidden rounded-lg">
      <div
        className={`overflow-x-auto rounded-lg bg-[#24292e] p-4 text-left max-w-${maxWidth} mx-auto`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
};

export const EmptyStateCard = ({
  feature,
  onPrimaryClick,
}: EmptyStateCardProps) => {
  const featureDefaults = feature
    ? EMPTY_STATE_FEATURES[feature]
    : ({
        title: "No Data Available",
        description:
          "Start sending requests through Helicone to see your analytics here.",
        icon: Tag,
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

  const renderCTA = () => {
    const cta = featureDefaults.cta;
    if (!cta) return null;

    return (
      <div className="flex gap-4">
        {cta.primary &&
          (cta.primary.onClick ? (
            <Button variant="default" onClick={onPrimaryClick}>
              {cta.primary.showPlusIcon && <Plus className="mr-2 h-4 w-4" />}
              {cta.primary.text}
            </Button>
          ) : cta.primary.link ? (
            <Link href={cta.primary.link} target="_blank">
              <Button variant="default">
                {cta.primary.showPlusIcon && <Plus className="mr-2 h-4 w-4" />}
                {cta.primary.text}
              </Button>
            </Link>
          ) : null)}
        {cta.secondary && (
          <Link href={cta.secondary.link} target="_blank">
            <Button variant="outline" className="gap-2">
              {cta.secondary.text}
              <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    );
  };

  // Standard layout for all empty states based on the properties format
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background py-16 dark:bg-sidebar-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 text-center">
        {/* Icon - Square shape */}
        {featureDefaults.icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-accent">
            {React.createElement(featureDefaults.icon, {
              size: 28,
              className: "text-accent-foreground",
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <H2>{featureDefaults.title}</H2>

          <P className="max-w-3xl text-muted-foreground">
            {featureDefaults.description}
          </P>
        </div>

        {/* Feature Image */}
        {featureDefaults.featureImage.type !== "none" && (
          <div className="w-full">
            {featureDefaults.featureImage.type === "code" ? (
              <ShikiHighlightedCode
                code={featureDefaults.featureImage.content}
                language={featureDefaults.featureImage.language || "http"}
                maxWidth={featureDefaults.featureImage.maxWidth}
              />
            ) : featureDefaults.featureImage.type === "video" ? (
              <div
                className={`relative overflow-hidden rounded-lg border border-border max-w-${
                  featureDefaults.featureImage.maxWidth || "xl"
                } mx-auto`}
              >
                <video
                  className="max-h-[500px] w-full object-contain"
                  src={featureDefaults.featureImage.content}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              </div>
            ) : (
              featureDefaults.featureImage.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featureDefaults.featureImage.content}
                  alt={featureDefaults.title}
                  className={`h-auto w-full rounded-lg border border-border max-w-${
                    featureDefaults.featureImage.maxWidth || "xl"
                  } mx-auto`}
                />
              )
            )}
          </div>
        )}

        {/* Buttons */}
        {renderCTA()}
      </div>
    </div>
  );
};
