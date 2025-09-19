"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Copy,
  Check,
  KeyRound,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJawnClient } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";
import { StandardParameter } from "@helicone-package/cost/models/types";

type ModelRegistryItem = components["schemas"]["ModelRegistryItem"];

interface ModelDetailPageProps {
  initialModel: ModelRegistryItem | null;
  modelName: string;
}

const formatContext = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

const formatCost = (value: number) => {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  if (value < 1) {
    return `$${value.toFixed(3)}`;
  }
  return `$${value.toFixed(2)}`;
};

export function ModelDetailPage({ initialModel, modelName }: ModelDetailPageProps) {

  const [model, setModel] = useState<ModelRegistryItem | null>(initialModel);
  const [loading, setLoading] = useState(!initialModel);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set()
  );
  const [currentLanguage, setCurrentLanguage] = useState<
    "typescript" | "python"
  >("typescript");
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedModelId, setCopiedModelId] = useState(false);

  const toggleProviderExpansion = (provider: string) => {
    setExpandedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!initialModel) {
      const fetchModel = async () => {
        try {
          const jawnClient = getJawnClient();
          const response = await jawnClient.GET(
            "/v1/public/model-registry/models"
          );

          if (response.data?.data?.models) {
            const foundModel = response.data.data.models.find(
              (m: ModelRegistryItem) => m.id === modelName
            );
            setModel(foundModel || null);
          }
        } catch (error) {
          console.error("Failed to fetch model:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchModel();
    }
  }, [modelName, initialModel]);

  // Update highlighted code when language or model changes
  useEffect(() => {
    if (!model) return;

    let mounted = true;

    const highlightCode = async () => {
      try {
        const { createHighlighter } = await import("shiki");

        if (!mounted) return;

        const highlighter = await createHighlighter({
          themes: ["github-dark"],
          langs: ["javascript", "python"],
        });

        if (!mounted) return;

        const codeSnippets = {
          typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "${model.id}",
  messages: [{ role: "user", content: "Hello!" }],
});`,
          python: `from openai import OpenAI
import os

client = OpenAI(
    base_url="https://ai-gateway.helicone.ai",
    api_key=os.environ["HELICONE_API_KEY"],
)

completion = client.chat.completions.create(
    model="${model.id}",
    messages=[{"role": "user", "content": "Hello!"}],
)`,
        };

        const html = highlighter.codeToHtml(codeSnippets[currentLanguage], {
          lang: currentLanguage === "typescript" ? "javascript" : "python",
          theme: "github-dark",
        });

        if (mounted) {
          setHighlightedCode(html);
        }
      } catch (error) {
        console.error("Failed to highlight code:", error);
      }
    };

    highlightCode();

    return () => {
      mounted = false;
    };
  }, [model, currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background antialiased">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-4" />
            <div className="h-4 w-96 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-card rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-background antialiased">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              Model not found
            </h1>
            <p className="text-muted-foreground">
              The model &quot;{modelName}&quot; could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cleanModelName = model.name.replace(
    new RegExp(`^${model.author}:\s*`, "i"),
    ""
  );

  const firstEndpoint = model.endpoints[0];

  // Use first pricing tier for capabilities or base pricing
  const basePricing =
    firstEndpoint.pricingTiers && firstEndpoint.pricingTiers.length > 0
      ? firstEndpoint.pricingTiers[0]
      : firstEndpoint.pricing;

  return (
    <div className="min-h-screen bg-background antialiased">
      {/* Model Header */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {model.author}: {cleanModelName}
            </h1>
          </div>

          {/* Model ID and Quick Info */}
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs">
                  {model.id}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(model.id);
                    setCopiedModelId(true);
                    setTimeout(() => setCopiedModelId(false), 2000);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  title="Copy model ID"
                >
                  {copiedModelId ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              </div>
              {(model as ModelRegistryItem & { created?: string }).created && (
                <span className="text-gray-500 dark:text-gray-400">
                  Released{" "}
                  {new Date((model as ModelRegistryItem & { created?: string }).created!).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  )}
                </span>
              )}
            </div>

            {/* Key Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Context:{" "}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatContext(model.contextLength)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Max Output:{" "}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {model.maxOutput ? formatContext(model.maxOutput) : "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Input:{" "}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCost(basePricing.prompt)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    /1M
                  </span>
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Output:{" "}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCost(basePricing.completion)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    /1M
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {model.description && (
            <div className="mt-4">
              <div
                className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${
                  !isDescriptionExpanded ? "line-clamp-3" : ""
                }`}
              >
                {model.description}
              </div>
              {model.description.length > 200 && (
                <button
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Providers Section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Providers
            </h2>
          </div>
          <div>
            {model.endpoints
              .sort((a, b) => {
                const aPricing =
                  a.pricingTiers && a.pricingTiers.length > 0
                    ? a.pricingTiers[0]
                    : a.pricing;
                const bPricing =
                  b.pricingTiers && b.pricingTiers.length > 0
                    ? b.pricingTiers[0]
                    : b.pricing;
                const aAvg = (aPricing.prompt + aPricing.completion) / 2;
                const bAvg = (bPricing.prompt + bPricing.completion) / 2;
                return aAvg - bAvg;
              })
              .map((endpoint, index) => {
                const pricingArray = endpoint.pricingTiers;
                const hasTiers = pricingArray && pricingArray.length > 0;
                const pricing =
                  hasTiers && pricingArray ? pricingArray[0] : endpoint.pricing;
                const isExpanded = expandedProviders.has(endpoint.provider);

                // Debug provider name
                console.log("Provider:", endpoint.provider);

                return (
                  <div key={endpoint.provider}>
                    <div
                      className={`${index > 0 ? "border-t border-gray-200 dark:border-gray-800" : ""}`}
                    >
                      {/* Clickable Header Area */}
                      <div
                        className="py-4 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        onClick={() =>
                          toggleProviderExpansion(endpoint.provider)
                        }
                      >
                        {/* Provider Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                              {endpoint.provider}
                            </span>
                            {endpoint.supportsPtb && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-normal text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5">
                                  Credits
                                </span>
                                {endpoint.provider.toLowerCase() ===
                                  "openrouter" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>
                                          OpenRouter is used as a fallback when
                                          rate limits are reached to ensure
                                          uninterrupted service. Credits shown
                                          are worst-case escrow; actual charges
                                          match OpenRouter&apos;s pricing.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        {/* Pricing Grid - Always Visible */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              Context
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {formatContext(model.contextLength)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              Max Output
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {model.maxOutput
                                ? formatContext(model.maxOutput)
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              {endpoint.provider.toLowerCase() === "openrouter"
                                ? "Input (Max)"
                                : "Input"}
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {formatCost(pricing.prompt)}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                /1M
                              </span>
                              {endpoint.provider === "OpenRouter" && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                                  *
                                </span>
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              {endpoint.provider.toLowerCase() === "openrouter"
                                ? "Output (Max)"
                                : "Output"}
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {formatCost(pricing.completion)}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                /1M
                              </span>
                              {endpoint.provider === "OpenRouter" && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                                  *
                                </span>
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              Cache Read
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {pricing.cacheRead
                                ? `${formatCost(pricing.cacheRead)}/1M`
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                              Cache Write
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {pricing.cacheWrite
                                ? `${formatCost(pricing.cacheWrite)}/1M`
                                : "—"}
                            </span>
                          </div>
                          {(pricing.image || pricing.audio) && (
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                {pricing.image ? "Image" : "Audio"}
                              </span>
                              <span className="font-mono text-gray-900 dark:text-gray-100">
                                {pricing.image
                                  ? formatCost(pricing.image)
                                  : pricing.audio
                                    ? formatCost(pricing.audio)
                                    : "—"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4">
                          {/* OpenRouter Notice */}
                          {endpoint.provider === "OpenRouter" && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="text-amber-800 dark:text-amber-200">
                                  <p className="font-medium mb-1">
                                    Variable Pricing Model
                                  </p>
                                  <p>
                                    OpenRouter routes to multiple providers with
                                    different costs. Prices shown are the
                                    maximum (worst-case) for credit escrow.
                                    You&apos;ll be charged actual costs, which are
                                    typically lower.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Tiered Pricing */}
                          {hasTiers &&
                            pricingArray &&
                            pricingArray.length > 1 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                  Tiered Pricing
                                </p>
                                <div className="space-y-1">
                                  {pricingArray.map((tier, tierIndex) => (
                                    <div
                                      key={tierIndex}
                                      className="flex items-center gap-4 text-xs"
                                    >
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {tierIndex === 0
                                          ? "First"
                                          : `After ${tier.threshold ? formatContext(tier.threshold) : "0"}`}
                                        :
                                      </span>
                                      <span className="font-mono">
                                        {formatCost(tier.prompt)} /{" "}
                                        {formatCost(tier.completion)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Supported Parameters */}
                          {model.supportedParameters &&
                            model.supportedParameters.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                  Supported Parameters
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {model.supportedParameters.includes(
                                    "tools" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Tools
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "response_format" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      JSON Mode
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "structured_outputs" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Structured Output
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "stream" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Streaming
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "max_tokens" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Max Tokens
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "temperature" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Temperature
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "top_p" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Top P
                                    </span>
                                  )}
                                  {model.supportedParameters.includes(
                                    "logprobs" as StandardParameter
                                  ) && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      Log Probs
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quick Start
            </h2>
            <Link
              href="https://us.helicone.ai/settings/api-keys"
              target="_blank"
              rel="noopener"
            >
              <Button size="sm" variant="outline" className="gap-1">
                <KeyRound className="h-3 w-3" />
                Get API Key
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Use {model.name} through Helicone&apos;s AI Gateway with automatic
            logging and monitoring.
          </p>

          {/* Language Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCurrentLanguage("typescript")}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                currentLanguage === "typescript"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setCurrentLanguage("python")}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                currentLanguage === "python"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Python
            </button>
          </div>

          {/* Code Block */}
          <div className="relative group">
            {highlightedCode ? (
              <div
                className="overflow-x-auto rounded-lg bg-gray-900 text-gray-100 [&_pre]:!p-4"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              <div className="bg-gray-900 rounded-lg h-40 animate-pulse" />
            )}
            <button
              onClick={() => {
                const codeSnippets = {
                  typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "${model.id}",
  messages: [{ role: "user", content: "Hello!" }],
});`,
                  python: `from openai import OpenAI
import os

client = OpenAI(
    base_url="https://ai-gateway.helicone.ai",
    api_key=os.environ["HELICONE_API_KEY"],
)

completion = client.chat.completions.create(
    model="${model.id}",
    messages=[{"role": "user", "content": "Hello!"}],
)`,
                };
                navigator.clipboard.writeText(codeSnippets[currentLanguage]);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="absolute top-2 right-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              {copiedCode ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-gray-300" />
              )}
            </button>
          </div>

          <div className="mt-4">
            <Link
              href="https://docs.helicone.ai/getting-started/quick-start"
              target="_blank"
              rel="noopener"
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 px-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                View documentation
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
