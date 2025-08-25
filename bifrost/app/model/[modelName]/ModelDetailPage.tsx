"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJawnClient } from "@/lib/clients/jawnHook";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  ChevronRight,
  Zap,
  Brain,
  Globe,
  Image,
  FileText,
  Clock,
  DollarSign,
  Package,
  Activity,
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

interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  pricing: {
    prompt: number;
    completion: number;
    audio?: number;
    web_search?: number;
    video?: number;
    image?: number;
    thinking?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  supportsPtb?: boolean;
}

type InputModality = "text" | "image" | "audio" | "video";
type OutputModality = "text" | "image" | "audio" | "video";
type StandardParameter =
  | "max_tokens"
  | "temperature"
  | "top_p"
  | "top_k"
  | "stop"
  | "stream"
  | "frequency_penalty"
  | "presence_penalty"
  | "repetition_penalty"
  | "seed"
  | "tools"
  | "tool_choice"
  | "functions"
  | "function_call"
  | "reasoning"
  | "include_reasoning"
  | "thinking"
  | "response_format"
  | "json_mode"
  | "truncate"
  | "min_p"
  | "logit_bias"
  | "logprobs"
  | "top_logprobs"
  | "structured_outputs";

interface Model {
  id: string;
  name: string;
  author: string;
  contextLength: number;
  endpoints: ModelEndpoint[];
  maxOutput?: number;
  trainingDate?: string;
  description?: string;
  inputModalities: InputModality[];
  outputModalities: OutputModality[];
  supportedParameters: StandardParameter[];
}

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

const parameterLabels: Record<StandardParameter, string> = {
  max_tokens: "Max Tokens",
  temperature: "Temperature",
  top_p: "Top-P",
  top_k: "Top-K",
  stop: "Stop Sequences",
  stream: "Streaming",
  frequency_penalty: "Frequency Penalty",
  presence_penalty: "Presence Penalty",
  repetition_penalty: "Repetition Penalty",
  seed: "Seed",
  tools: "Function Calling",
  tool_choice: "Tool Choice",
  functions: "Functions",
  function_call: "Function Call",
  reasoning: "Reasoning",
  include_reasoning: "Include Reasoning",
  thinking: "Chain of Thought",
  response_format: "Response Format",
  json_mode: "JSON Mode",
  truncate: "Truncate",
  min_p: "Min-P",
  logit_bias: "Logit Bias",
  logprobs: "Log Probabilities",
  top_logprobs: "Top Log Probs",
  structured_outputs: "Structured Outputs",
};

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
              .filter((m: Model) => 
                m.author === foundModel.author && 
                m.id !== foundModel.id
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
  }, [decodedModelName, jawnClient]);

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

  const cheapestEndpoint = model.endpoints.reduce((min, ep) =>
    (ep.pricing.prompt + ep.pricing.completion) / 2 <
    (min.pricing.prompt + min.pricing.completion) / 2
      ? ep
      : min
  );

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

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
                  Context Length
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatContext(model.contextLength)}
                </div>
                <p className="text-sm text-gray-500 mt-1">tokens</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCost(cheapestEndpoint.pricing.prompt)}
                    </span>
                    <span className="text-sm text-gray-500">input</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCost(cheapestEndpoint.pricing.completion)}
                    </span>
                    <span className="text-sm text-gray-500">output</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
                  Max Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {model.maxOutput
                    ? formatContext(model.maxOutput)
                    : "Unlimited"}
                </div>
                {model.maxOutput && (
                  <p className="text-sm text-gray-500 mt-1">tokens</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mb-12">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Modalities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Modalities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Input
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {model.inputModalities.map((modality) => (
                          <Badge key={modality} variant="secondary">
                            {getModalityIcon(modality)}
                            <span className="ml-1 capitalize">{modality}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Output
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {model.outputModalities.map((modality) => (
                          <Badge key={modality} variant="secondary">
                            {getModalityIcon(modality)}
                            <span className="ml-1 capitalize">{modality}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Capabilities */}
                {capabilities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Special Capabilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {capabilities.map((cap) => (
                          <div
                            key={cap.key}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {cap.label}
                            </span>
                            {cap.cost && (
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {cap.cost}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Training Date */}
                {model.trainingDate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Training Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {new Date(model.trainingDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                            }
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing by Provider</CardTitle>
                  <CardDescription>
                    Compare pricing across different providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Input</TableHead>
                        <TableHead className="text-right">Output</TableHead>
                        <TableHead className="text-right">Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {model.endpoints
                        .sort((a, b) => {
                          const aAvg =
                            (a.pricing.prompt + a.pricing.completion) / 2;
                          const bAvg =
                            (b.pricing.prompt + b.pricing.completion) / 2;
                          return aAvg - bAvg;
                        })
                        .map((endpoint) => {
                          const avgCost =
                            (endpoint.pricing.prompt +
                              endpoint.pricing.completion) /
                            2;
                          const isCheapest = endpoint === cheapestEndpoint;

                          return (
                            <TableRow key={endpoint.provider}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {endpoint.provider}
                                  {isCheapest && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Cheapest
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCost(endpoint.pricing.prompt)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCost(endpoint.pricing.completion)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCost(avgCost)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supported Parameters</CardTitle>
                  <CardDescription>
                    API parameters supported by this model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {model.supportedParameters.map((param) => (
                      <div
                        key={param}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {parameterLabels[param] || param}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="providers" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {model.endpoints.map((endpoint) => (
                  <Card key={endpoint.provider}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {endpoint.provider}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Input</span>
                          <span className="font-medium">
                            {formatCost(endpoint.pricing.prompt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Output</span>
                          <span className="font-medium">
                            {formatCost(endpoint.pricing.completion)}
                          </span>
                        </div>
                        {endpoint.supportsPtb && (
                          <div className="pt-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Prompt Token Batching
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Related Models */}
          {relatedModels.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                More from {model.author}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedModels.map((relatedModel) => {
                  const relatedCleanName = relatedModel.name.replace(
                    new RegExp(`^${relatedModel.author}:\s*`, "i"),
                    ""
                  );

                  return (
                    <Link
                      key={relatedModel.id}
                      href={`/model/${encodeURIComponent(relatedModel.id)}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <CardTitle className="text-base">
                            {relatedCleanName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              {formatContext(relatedModel.contextLength)}{" "}
                              context
                            </div>
                            <div>
                              {formatCost(
                                Math.min(
                                  ...relatedModel.endpoints.map(
                                    (e) => e.pricing.prompt
                                  )
                                )
                              )}{" "}
                              input
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}