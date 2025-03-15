import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SquareArrowOutUpRight,
  Tag,
  Layers,
  Gauge,
  User,
  CircleDashed,
  GitBranch,
  Bell,
  Archive,
  Shield,
} from "lucide-react";
import { createHighlighter } from "shiki";
import { H2, P } from "@/components/ui/typography";

// Create a singleton highlighter instance
const highlighterPromise = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "python", "bash", "http", "plaintext"],
});

interface EmptyStateFeature {
  title: string;
  description: string;
  icon?: React.ElementType;
  featureImage: {
    type: "image" | "video" | "code";
    content: string;
    language?: string;
    maxWidth?: string;
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

// Feature definitions with consistent structure
export const EMPTY_STATE_FEATURES: Record<string, EmptyStateFeature> = {
  prompts: {
    title: "Create Your First Prompt",
    description:
      "Design, test, and version control your AI prompts all in one place.",
    icon: Tag,
    featureImage: {
      type: "code",
      content: `// 1. Format your prompt with variables
const prompt = hpf\`Explain \${{ topic }} to a \${{ audience }}\`;

// 2. Send requests with the prompt ID
headers: { "Helicone-Prompt-Id": "explain_topic" }`,
      language: "typescript",
      maxWidth: "2xl",
    },
    cta: {
      primary: {
        text: "Create First Prompt",
        link: "/prompts/new",
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/prompts",
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
    icon: Bell,
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

interface EmptyStateCardProps {
  feature: EmptyStateFeatureKey;
  customActions?: React.ReactNode;
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
        '<pre class="shiki rounded-lg" style="text-align: left;"'
      );
      setHighlightedCode(formattedHtml);
    };

    highlightCode();
  }, [code, language]);

  return (
    <div className="rounded-lg overflow-hidden w-full">
      <div
        className={`rounded-lg p-4 bg-[#24292e] overflow-x-auto text-left max-w-${maxWidth} mx-auto`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
};

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  feature,
  customActions,
}) => {
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

  // Standard layout for all empty states based on the properties format
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background dark:bg-sidebar-background py-16">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-8 px-4">
        {/* Icon - Square shape */}
        {featureDefaults.icon && (
          <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center border border-border">
            {React.createElement(featureDefaults.icon, {
              size: 28,
              className: "text-accent-foreground",
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <H2>{featureDefaults.title}</H2>

          <P className="text-muted-foreground max-w-3xl">
            {featureDefaults.description}
          </P>
        </div>

        {/* Feature Image */}
        <div className="w-full">
          {featureDefaults.featureImage.type === "code" ? (
            <ShikiHighlightedCode
              code={featureDefaults.featureImage.content}
              language={featureDefaults.featureImage.language || "http"}
              maxWidth={featureDefaults.featureImage.maxWidth}
            />
          ) : featureDefaults.featureImage.type === "video" ? (
            <div
              className={`overflow-hidden relative rounded-lg border border-border max-w-${
                featureDefaults.featureImage.maxWidth || "xl"
              } mx-auto`}
            >
              <video
                className="w-full max-h-[500px] object-contain"
                src={featureDefaults.featureImage.content}
                autoPlay
                loop
                muted
                playsInline
                controls
              />
            </div>
          ) : (
            <img
              src={featureDefaults.featureImage.content}
              alt={featureDefaults.title}
              className={`w-full h-auto rounded-lg border border-border max-w-${
                featureDefaults.featureImage.maxWidth || "xl"
              } mx-auto`}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-row gap-3 pt-4">
          {customActions || (
            <>
              {featureDefaults.cta?.primary && (
                <Link href={featureDefaults.cta.primary.link} target="_blank">
                  <Button variant="default" className="gap-2">
                    {featureDefaults.cta.primary.text}
                    <SquareArrowOutUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {featureDefaults.cta?.secondary && (
                <Link href={featureDefaults.cta.secondary.link} target="_blank">
                  <Button variant="outline" className="gap-2">
                    {featureDefaults.cta.secondary.text}
                    <SquareArrowOutUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
