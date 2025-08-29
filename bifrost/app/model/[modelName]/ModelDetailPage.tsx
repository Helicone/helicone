"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJawnClient } from "@/lib/clients/jawnHook";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  ChevronRight,
  Zap,
  Brain,
  Globe,
  Image,
  FileText,
  Clock,
  Activity,
  DollarSign,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
type ModelEndpoint = components["schemas"]["ModelEndpoint"];
type SimplifiedPricing = components["schemas"]["SimplifiedPricing"];
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

const getModalityIcon = (modality: string) => {
  switch (modality) {
    case "text":
      return <FileText className="h-4 w-4" />;
    case "image":
    case "vision":
      return <Image className="h-4 w-4" />;
    case "audio":
      return <Activity className="h-4 w-4" />;
    case "video":
      return <Globe className="h-4 w-4" />;
    default:
      return <Brain className="h-4 w-4" />;
  }
};

const parameterLabels = PARAMETER_LABELS as Record<StandardParameter, string>;

export function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelName = params.modelName as string;
  const decodedModelName = decodeURIComponent(modelName);

  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [relatedModels, setRelatedModels] = useState<Model[]>([]);

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

            // Find related models from same author
            const related = allModels
              .filter(
                (m: Model) =>
                  m.author === foundModel.author && m.id !== foundModel.id
              )
              .slice(0, 4);
            setRelatedModels(related);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Model not found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The model &quot;{decodedModelName}&quot; could not be found.
            </p>
            <Button onClick={() => router.push("/models")} variant="outline">
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
    const epCost = (ep.pricing.prompt + ep.pricing.completion) / 2;
    const minCost = (min.pricing.prompt + min.pricing.completion) / 2;
    return epCost < minCost ? ep : min;
  });

  const capabilities: { key: string; label: string; cost?: string }[] = [];
  const pricing = cheapestEndpoint.pricing;

  if (pricing.audio && pricing.audio > 0) {
    capabilities.push({
      key: "audio",
      label: "Audio Processing",
      cost: formatCost(pricing.audio),
    });
  }
  if (pricing.video && pricing.video > 0) {
    capabilities.push({
      key: "video",
      label: "Video Processing",
      cost: formatCost(pricing.video),
    });
  }
  if (pricing.thinking && pricing.thinking > 0) {
    capabilities.push({
      key: "thinking",
      label: "Chain of Thought",
      cost: formatCost(pricing.thinking),
    });
  }
  if (pricing.web_search && pricing.web_search > 0) {
    capabilities.push({
      key: "search",
      label: "Web Search",
      cost: formatCost(pricing.web_search),
    });
  }
  if (pricing.image && pricing.image > 0) {
    capabilities.push({
      key: "vision",
      label: "Vision",
      cost: formatCost(pricing.image),
    });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link
            href="/models"
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            Models
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 dark:text-gray-100">
            {cleanModelName}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {cleanModelName}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                by {model.author}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(model.id, "model-id")}
              >
                {copiedText === "model-id" ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Model ID
              </Button>
              <Button
                onClick={() => router.push(`/comparison?models=${model.id}`)}
              >
                Compare
              </Button>
            </div>
          </div>
          {model.description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
              {model.description}
            </p>
          )}
        </div>

        {/* Primary Pricing Card - Cheapest Provider */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Best available pricing from {cheapestEndpoint.provider}
                </CardDescription>
              </div>
              {cheapestEndpoint.supportsPtb && (
                <Badge variant="outline">
                  <Zap className="h-3 w-3 mr-1" />
                  Pass-through billing
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cheapestEndpoint.pricingTiers && cheapestEndpoint.pricingTiers.length > 1 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Context Window</TableHead>
                    <TableHead className="text-right">Input Price</TableHead>
                    <TableHead className="text-right">Output Price</TableHead>
                    {cheapestEndpoint.pricingTiers.some((t: SimplifiedPricing) => t.cacheRead || t.cacheWrite) && (
                      <>
                        <TableHead className="text-right">Cache Read</TableHead>
                        <TableHead className="text-right">Cache Write</TableHead>
                      </>
                    )}
                    {cheapestEndpoint.pricingTiers.some((t: SimplifiedPricing) => t.audio) && (
                      <TableHead className="text-right">Input Audio</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cheapestEndpoint.pricingTiers.map((tier: SimplifiedPricing & { threshold?: number }, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {idx === 0 && cheapestEndpoint.pricingTiers!.length > 1 ? (
                          <>
                            ≤{(cheapestEndpoint.pricingTiers![1] as any).threshold >= 1000000 
                              ? `${((cheapestEndpoint.pricingTiers![1] as any).threshold / 1000000).toFixed(0)}M` 
                              : `${((cheapestEndpoint.pricingTiers![1] as any).threshold / 1000).toFixed(0)}K`}
                          </>
                        ) : tier.threshold && tier.threshold > 0 ? (
                          <>
                            &gt;{tier.threshold >= 1000000 
                              ? `${(tier.threshold / 1000000).toFixed(0)}M` 
                              : `${(tier.threshold / 1000).toFixed(0)}K`}
                          </>
                        ) : (
                          "Standard"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCost(tier.prompt)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCost(tier.completion)}
                      </TableCell>
                      {cheapestEndpoint.pricingTiers.some((t: SimplifiedPricing) => t.cacheRead || t.cacheWrite) && (
                        <>
                          <TableCell className="text-right font-mono">
                            {tier.cacheRead ? formatCost(tier.cacheRead) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {tier.cacheWrite ? formatCost(tier.cacheWrite) : '—'}
                          </TableCell>
                        </>
                      )}
                      {cheapestEndpoint.pricingTiers.some((t: SimplifiedPricing) => t.audio) && (
                        <TableCell className="text-right font-mono">
                          {tier.audio ? formatCost(tier.audio) : '—'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Input</p>
                  <p className="text-2xl font-bold">{formatCost(cheapestEndpoint.pricing.prompt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Output</p>
                  <p className="text-2xl font-bold">{formatCost(cheapestEndpoint.pricing.completion)}</p>
                </div>
                {cheapestEndpoint.pricing.cacheRead && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cache Read</p>
                    <p className="text-2xl font-bold">{formatCost(cheapestEndpoint.pricing.cacheRead)}</p>
                  </div>
                )}
                {cheapestEndpoint.pricing.cacheWrite && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cache Write</p>
                    <p className="text-2xl font-bold">{formatCost(cheapestEndpoint.pricing.cacheWrite)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Specifications */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-gray-500">
                Context Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatContext(model.contextLength)}
              </div>
              <p className="text-xs text-gray-500 mt-1">tokens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-gray-500">
                Max Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {model.maxOutput ? formatContext(model.maxOutput) : "Variable"}
              </div>
              <p className="text-xs text-gray-500 mt-1">tokens</p>
            </CardContent>
          </Card>

          {model.trainingDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
                  Training Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(model.trainingDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-gray-500">
                Modalities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {model.inputModalities.map((modality) => (
                  <span key={modality} title={modality}>
                    {getModalityIcon(modality)}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Providers Overview Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Provider Availability</CardTitle>
            <CardDescription>
              All providers offering this model with their base pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {model.endpoints
                .sort((a, b) => {
                  const aAvg = (a.pricing.prompt + a.pricing.completion) / 2;
                  const bAvg = (b.pricing.prompt + b.pricing.completion) / 2;
                  return aAvg - bAvg;
                })
                .map((endpoint) => {
                  const isCheapest = endpoint === cheapestEndpoint;
                  const hasTiers = endpoint.pricingTiers && endpoint.pricingTiers.length > 1;
                  
                  return (
                    <div
                      key={endpoint.provider}
                      className={`border rounded-lg p-4 ${
                        isCheapest ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{endpoint.provider}</h3>
                          {hasTiers && (
                            <p className="text-xs text-gray-500 mt-1">
                              {endpoint.pricingTiers!.length} pricing tiers
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {isCheapest && (
                            <Badge variant="secondary" className="text-xs">
                              Best Price
                            </Badge>
                          )}
                          {endpoint.supportsPtb && (
                            <Badge variant="outline" className="text-xs">
                              PTB
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Input:</span>
                          <span className="font-mono font-medium">
                            {formatCost(endpoint.pricing.prompt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Output:</span>
                          <span className="font-mono font-medium">
                            {formatCost(endpoint.pricing.completion)}
                          </span>
                        </div>
                        {(endpoint.pricing.cacheRead || endpoint.pricing.cacheWrite) && (
                          <div className="pt-2 border-t text-xs">
                            <span className="text-gray-500">Cache support</span>
                          </div>
                        )}
                        {(endpoint.pricing.audio || endpoint.pricing.thinking) && (
                          <div className="text-xs">
                            <span className="text-gray-500">Special features</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Additional Details */}
        <Tabs defaultValue="parameters" className="mb-12">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="related">Related Models</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Supported Parameters</CardTitle>
                <CardDescription>
                  API parameters that can be used with this model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {model.supportedParameters.map((param) => (
                    <div
                      key={param}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {parameterLabels[param] || param}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities" className="mt-6">
            {capabilities.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Special Capabilities</CardTitle>
                  <CardDescription>
                    Additional features with their associated costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {capabilities.map((cap) => (
                      <div
                        key={cap.key}
                        className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <span className="font-medium">{cap.label}</span>
                        {cap.cost && (
                          <span className="font-mono text-sm">{cap.cost}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-500">
                    No special capabilities available for this model
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="related" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Related Models</CardTitle>
                <CardDescription>
                  Other models from {model.author}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {relatedModels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedModels.map((relatedModel) => (
                      <div
                        key={relatedModel.id}
                        className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/model/${encodeURIComponent(relatedModel.id)}`)}
                      >
                        <h4 className="font-semibold mb-2">
                          {relatedModel.name.replace(
                            new RegExp(`^${relatedModel.author}:\s*`, "i"),
                            ""
                          )}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>
                            Context: {formatContext(relatedModel.contextLength)}
                          </div>
                          <div>
                            From {formatCost(
                              Math.min(
                                ...relatedModel.endpoints.map(
                                  (e: ModelEndpoint) => e.pricing.prompt
                                )
                              )
                            )} input
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No other models available from this author
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}