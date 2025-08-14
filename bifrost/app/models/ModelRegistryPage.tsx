"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, ChevronRight, DollarSign, Zap, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelEndpoint {
  provider: string;
  region?: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  supportsPtb?: boolean;
}

interface Model {
  name: string;
  author: string;
  contextLength: number;
  description?: string;
  releaseDate?: string;
}

interface ModelData {
  models: Record<string, Model>;
  endpoints: Record<string, ModelEndpoint[]>;
}

export function ModelRegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [registryData, setRegistryData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load model data
    function loadData() {
      try {
        const modelsResult = registry.getAllModelsWithIds();
        
        if (modelsResult.data) {
          const models = modelsResult.data;
          const endpoints: Record<string, ModelEndpoint[]> = {};
          
          Object.keys(models).forEach((modelId) => {
            const endpointsResult = registry.getModelEndpoints(modelId);
            if (endpointsResult.data) {
              endpoints[modelId] = endpointsResult.data;
            }
          });
          
          setRegistryData({ models, endpoints });
        }
      } catch (error) {
        console.error("Failed to load model registry:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const toggleModel = (modelKey: string) => {
    setExpandedModels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(modelKey)) {
        newSet.delete(modelKey);
      } else {
        newSet.add(modelKey);
      }
      return newSet;
    });
  };

  // Get unique providers and authors
  const { allProviders, allAuthors } = useMemo(() => {
    if (!registryData) return { allProviders: [], allAuthors: [] };
    
    const providers = new Set<string>();
    const authors = new Set<string>();
    
    Object.values(registryData.endpoints).forEach((endpointList) => {
      endpointList.forEach((endpoint) => {
        providers.add(endpoint.provider);
      });
    });
    
    Object.values(registryData.models).forEach((model) => {
      authors.add(model.author);
    });
    
    return {
      allProviders: Array.from(providers).sort(),
      allAuthors: Array.from(authors).sort(),
    };
  }, [registryData]);

  // Filter models
  const filteredModels = useMemo(() => {
    if (!registryData) return [];
    
    return Object.entries(registryData.models).filter(([modelKey, model]) => {
      const matchesSearch = searchQuery
        ? modelKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const endpoints = registryData.endpoints[modelKey] || [];
      const matchesProvider =
        selectedProvider === "all"
          ? true
          : endpoints.some((ep) => ep.provider === selectedProvider);

      const matchesAuthor =
        selectedAuthor === "all" ? true : model.author === selectedAuthor;

      return matchesSearch && matchesProvider && matchesAuthor && endpoints.length > 0;
    });
  }, [registryData, searchQuery, selectedProvider, selectedAuthor]);

  // Group by author for better organization
  const modelsByAuthor = useMemo(() => {
    const grouped: Record<string, Array<[string, Model]>> = {};
    
    filteredModels.forEach(([key, model]) => {
      if (!grouped[model.author]) {
        grouped[model.author] = [];
      }
      grouped[model.author].push([key, model]);
    });
    
    // Sort each author's models by name
    Object.keys(grouped).forEach((author) => {
      grouped[author].sort((a, b) => a[1].name.localeCompare(b[1].name));
    });
    
    return grouped;
  }, [filteredModels]);

  const formatCost = (cost: number) => {
    return `$${(cost / 1000000).toFixed(3)}`;
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      anthropic: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      google: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "meta-llama": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      mistralai: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      amazon: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      groq: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      deepseek: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    };
    return colors[provider] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto px-4">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid gap-4 mt-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Model Registry
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore {Object.keys(registryData?.models || {}).length}+ models across {allProviders.length} providers. 
          Real-time pricing and availability powered by Helicone AI Gateway.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Unified Access with AI Gateway
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Access any model below through a single API endpoint. The gateway automatically routes to the best available provider based on your API keys and preferences.
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="text-xs" asChild>
                <a href="/docs/observability/tracing/ai-gateway" target="_blank">
                  View Documentation
                </a>
              </Button>
              <Button size="sm" className="text-xs" asChild>
                <a href="https://helicone.ai/signup" target="_blank">
                  Get Started Free
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {allProviders.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Authors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Authors</SelectItem>
            {allAuthors.map((author) => (
              <SelectItem key={author} value={author}>
                {author}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{filteredModels.length} models</span>
        <span>•</span>
        <span>{Object.keys(modelsByAuthor).length} organizations</span>
      </div>

      {/* Models List */}
      <div className="space-y-6">
        {Object.entries(modelsByAuthor)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([author, models]) => (
            <div key={author} className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 capitalize">
                {author}
              </h2>
              <div className="grid gap-2">
                {models.map(([modelKey, model]) => {
                  const endpoints = registryData?.endpoints[modelKey] || [];
                  const isExpanded = expandedModels.has(modelKey);
                  const costs = endpoints.map((ep) => ep.pricing.prompt);
                  const minCost = costs.length > 0 ? Math.min(...costs) : 0;
                  const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

                  return (
                    <Card
                      key={modelKey}
                      className="overflow-hidden transition-all hover:shadow-md"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleModel(modelKey)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <button className="mt-1 text-gray-400">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {model.name.replace(/^[^:]+:\s*/, "")}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {model.contextLength.toLocaleString()} tokens
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {modelKey}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {endpoints.slice(0, 4).map((endpoint, idx) => (
                                  <TooltipProvider key={idx}>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge
                                          variant="secondary"
                                          className={`text-xs ${getProviderColor(endpoint.provider)}`}
                                        >
                                          {endpoint.provider}
                                          {endpoint.region && (
                                            <span className="ml-1 opacity-60">
                                              ({endpoint.region})
                                            </span>
                                          )}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs">
                                          <div>Input: {formatCost(endpoint.pricing.prompt)}/1K</div>
                                          <div>Output: {formatCost(endpoint.pricing.completion)}/1K</div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                                {endpoints.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{endpoints.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-3 w-3" />
                              {minCost === maxCost ? (
                                <span>{formatCost(minCost)}</span>
                              ) : (
                                <span>
                                  {formatCost(minCost)} - {formatCost(maxCost)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">per 1K tokens</p>
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t bg-gray-50 dark:bg-gray-900/50 p-4">
                          <h4 className="text-sm font-semibold mb-3">Available Endpoints</h4>
                          <div className="grid gap-2">
                            {endpoints.map((endpoint, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-800 border"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className={getProviderColor(endpoint.provider)}>
                                    {endpoint.provider}
                                  </Badge>
                                  {endpoint.region && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {endpoint.region}
                                    </span>
                                  )}
                                  {endpoint.supportsPtb && (
                                    <Badge variant="outline" className="text-xs">
                                      PTB
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-right">
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Input: {formatCost(endpoint.pricing.prompt)}/1K
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Output: {formatCost(endpoint.pricing.completion)}/1K
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              <strong>AI Gateway Usage:</strong> Use model name <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">{modelKey}</code> or specify provider with <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">{modelKey}/{endpoints[0]?.provider}</code>
                            </p>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {filteredModels.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No models found matching your criteria
          </p>
        </Card>
      )}
    </div>
  );
}