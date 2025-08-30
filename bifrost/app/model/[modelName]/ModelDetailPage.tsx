"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useJawnClient } from "@/lib/clients/jawnHook";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PARAMETER_LABELS } from "@helicone-package/cost/models/types";
import type { components } from "@/lib/clients/jawnTypes/public";

type ModelRegistryItem = components["schemas"]["ModelRegistryItem"];
type StandardParameter = components["schemas"]["StandardParameter"];
type Model = ModelRegistryItem;


const formatCost = (costPerMillion: number) => {
  if (costPerMillion === 0) return "Free";
  if (costPerMillion < 0.01) return `$${(costPerMillion * 1000).toFixed(2)}/K`;
  if (costPerMillion < 1) return `$${costPerMillion.toFixed(3)}/M`;
  return `$${costPerMillion.toFixed(2)}/M`;
};

const formatContext = (tokens: number) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
};


const parameterLabels = PARAMETER_LABELS as Record<StandardParameter, string>;

export function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelName = params.modelName as string;
  const decodedModelName = decodeURIComponent(modelName);

  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const jawnClient = useJawnClient();

  useEffect(() => {
    async function loadModel() {
      try {
        const response = await jawnClient.GET(
          "/v1/public/model-registry/models"
        );
        if (response.data?.data) {
          const allModels = response.data.data.models || [];

          // Find the specific model by ID
          const foundModel = allModels.find(
            (m: Model) => m.id === decodedModelName
          );

          if (foundModel) {
            setModel(foundModel);
          }
        }
      } catch (error) {
        console.error("Failed to load model:", error);
      } finally {
        setLoading(false);
      }
    }

    loadModel();
  }, [decodedModelName]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-white dark:bg-gray-900 rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Model not found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The model &quot;{decodedModelName}&quot; could not be found.
            </p>
            <Button 
              onClick={() => router.push(`/models${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)} 
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Models
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const cleanModelName = model.name.replace(
    new RegExp(`^${model.author}:\s*`, "i"),
    ""
  );

  const cheapestEndpoint = model.endpoints.reduce((min, ep) => {
    // Use base pricing or first tier for comparison
    const epPricing = ep.pricingTiers && ep.pricingTiers.length > 0 
      ? ep.pricingTiers[0] 
      : ep.pricing;
    const minPricing = min.pricingTiers && min.pricingTiers.length > 0
      ? min.pricingTiers[0]
      : min.pricing;

    if (!epPricing || !minPricing) return min;

    const epCost = (epPricing.prompt + epPricing.completion) / 2;
    const minCost = (minPricing.prompt + minPricing.completion) / 2;
    return epCost < minCost ? ep : min;
  });

  const capabilities: { key: string; label: string; cost?: string }[] = [];
  // Use first pricing tier for capabilities or base pricing
  const basePricing = cheapestEndpoint.pricingTiers && cheapestEndpoint.pricingTiers.length > 0
    ? cheapestEndpoint.pricingTiers[0]
    : cheapestEndpoint.pricing;

  if (basePricing && basePricing.audio && basePricing.audio > 0) {
    capabilities.push({
      key: "audio",
      label: "Audio Processing",
      cost: formatCost(basePricing.audio),
    });
  }
  if (basePricing && basePricing.thinking && basePricing.thinking > 0) {
    capabilities.push({
      key: "thinking",
      label: "Chain of Thought",
      cost: formatCost(basePricing.thinking),
    });
  }
  if (
    basePricing &&
    (basePricing.cacheRead || basePricing.cacheWrite)
  ) {
    capabilities.push({
      key: "caching",
      label: "Prompt Caching",
      cost: basePricing.cacheRead
        ? formatCost(basePricing.cacheRead)
        : undefined,
    });
  }
  if (basePricing && basePricing.web_search && basePricing.web_search > 0) {
    capabilities.push({
      key: "search",
      label: "Web Search",
      cost: formatCost(basePricing.web_search),
    });
  }
  if (basePricing && basePricing.image && basePricing.image > 0) {
    capabilities.push({
      key: "vision",
      label: "Vision",
      cost: formatCost(basePricing.image),
    });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back to Models Link */}
        <div className="mb-4">
          <Link 
            href={`/models${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Models
          </Link>
        </div>

        {/* Compact Header */}
        <div className="mb-8">
          {/* Model Name and ID */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {model.author}: {cleanModelName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span className="font-mono flex items-center gap-1">
                  {model.id}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToClipboard(model.id, "Model ID")}
                  >
                    {copiedText === "Model ID" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </span>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                {model.trainingDate && (
                  <span className="text-gray-500">
                    Created{" "}
                    {new Date(model.trainingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span className="text-gray-500">
                  {formatContext(model.contextLength)} context
                </span>
                <span className="text-gray-500">
                  Starting at {formatCost(basePricing.prompt)}{" "}
                  input tokens
                </span>
                <span className="text-gray-500">
                  Starting at {formatCost(basePricing.completion)}{" "}
                  output tokens
                </span>
                {model.maxOutput && (
                  <span className="text-gray-500">
                    {formatContext(model.maxOutput)} max output
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Description */}
          {model.description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-4xl">
              {model.description}
            </p>
          )}
        </div>

        {/* Overview Section */}
        <div className="space-y-8">
              {/* Providers Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Providers for {cleanModelName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Available through {model.endpoints.length} provider
                  {model.endpoints.length > 1 ? "s" : ""}. Prices shown per 1M
                  tokens.
                </p>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Total Context</TableHead>
                        <TableHead>Max Output</TableHead>
                        <TableHead>Input Price</TableHead>
                        <TableHead>Output Price</TableHead>
                        <TableHead>Cache Read</TableHead>
                        <TableHead>Cache Write</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {model.endpoints
                        .sort((a, b) => {
                          const aPricing = a.pricingTiers && a.pricingTiers.length > 0
                            ? a.pricingTiers[0]
                            : a.pricing;
                          const bPricing = b.pricingTiers && b.pricingTiers.length > 0
                            ? b.pricingTiers[0]
                            : b.pricing;
                          const aAvg = (aPricing.prompt + aPricing.completion) / 2;
                          const bAvg = (bPricing.prompt + bPricing.completion) / 2;
                          return aAvg - bAvg;
                        })
                        .map((endpoint) => {
                          const isCheapest = endpoint === cheapestEndpoint;
                          // Check for pricing tiers
                          const pricingArray = endpoint.pricingTiers;
                          const hasTiers =
                            pricingArray && pricingArray.length > 0;

                          return (
                            <TableRow
                              key={endpoint.provider}
                              className={
                                isCheapest
                                  ? "bg-green-50 dark:bg-green-950/10"
                                  : ""
                              }
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/providers/${endpoint.providerSlug}`}
                                    className="hover:underline"
                                  >
                                    {endpoint.provider}
                                  </Link>
                                  {isCheapest && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                      Cheapest
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatContext(model.contextLength)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {model.maxOutput
                                  ? formatContext(model.maxOutput)
                                  : "--"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {hasTiers && pricingArray ? (
                                  <div className="space-y-0.5">
                                    {pricingArray.map(
                                      (tier: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="whitespace-nowrap"
                                        >
                                          {idx > 0 && (
                                            <span className="text-gray-500 text-xs">
                                              Tier {idx + 1}:{" "}
                                            </span>
                                          )}
                                          <span className="font-mono">
                                            {formatCost(tier.prompt)}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-mono">
                                    {formatCost(endpoint.pricing.prompt)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {hasTiers && pricingArray ? (
                                  <div className="space-y-0.5">
                                    {pricingArray.map(
                                      (tier: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="whitespace-nowrap"
                                        >
                                          {idx > 0 && (
                                            <span className="text-gray-500 text-xs">
                                              Tier {idx + 1}:{" "}
                                            </span>
                                          )}
                                          <span className="font-mono">
                                            {formatCost(tier.completion)}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-mono">
                                    {formatCost(endpoint.pricing.completion)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {endpoint.pricing.cacheRead
                                  ? formatCost(endpoint.pricing.cacheRead)
                                  : "--"}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {endpoint.pricing.cacheWrite
                                  ? formatCost(endpoint.pricing.cacheWrite)
                                  : "--"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Model Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Model Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">
                      Context Window
                    </span>
                    <p className="font-medium">
                      {formatContext(model.contextLength)} tokens
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Max Output</span>
                    <p className="font-medium">
                      {model.maxOutput
                        ? formatContext(model.maxOutput) + " tokens"
                        : "Unlimited"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      Input Modalities
                    </span>
                    <p className="font-medium">
                      {model.inputModalities.join(", ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      Output Modalities
                    </span>
                    <p className="font-medium">
                      {model.outputModalities.join(", ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Training Date</span>
                    <p className="font-medium">
                      {model.trainingDate
                        ? new Date(model.trainingDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Capabilities */}
              {capabilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Special Capabilities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {capabilities.map((cap) => (
                      <div
                        key={cap.key}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="text-sm font-medium">{cap.label}</span>
                        {cap.cost && (
                          <span className="text-sm text-gray-500">
                            {cap.cost}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
