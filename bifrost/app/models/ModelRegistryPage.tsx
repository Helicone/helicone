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
import { 
  Search,
  Zap,
  ArrowUpDown,
  Filter,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  Eye,
  Code,
  FileJson,
  Gauge,
  DollarSign,
  Calendar,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  id: string;
  name: string;
  author: string;
  contextLength: number;
  endpoints: ModelEndpoint[];
  // New fields for better UX
  capabilities?: {
    vision?: boolean;
    functionCalling?: boolean;
    jsonMode?: boolean;
    streaming?: boolean;
  };
  maxOutput?: number;
  trainingDate?: string;
  description?: string;
  speed?: 'fast' | 'medium' | 'slow';
  quality?: 'high' | 'medium' | 'budget';
}

type SortOption = "name" | "price-low" | "price-high" | "context" | "value" | "speed" | "newest";
type ContextFilter = "all" | "small" | "medium" | "large" | "xlarge";
type PriceFilter = "all" | "free" | "cheap" | "moderate" | "expensive";

export function ModelRegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [capabilityFilters, setCapabilityFilters] = useState({
    vision: false,
    functionCalling: false,
    jsonMode: false,
    streaming: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        setModels(data.models || []);
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const { allProviders, allAuthors } = useMemo(() => {
    const providers = new Set<string>();
    const authors = new Set<string>();
    
    models.forEach((model) => {
      authors.add(model.author);
      model.endpoints.forEach((endpoint) => {
        providers.add(endpoint.provider);
      });
    });
    
    return {
      allProviders: Array.from(providers).sort(),
      allAuthors: Array.from(authors).sort(),
    };
  }, [models]);

  const processedModels = useMemo(() => {
    let filtered = models.filter((model) => {
      // Search filter
      const matchesSearch = searchQuery
        ? model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.author.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // Provider filter
      const matchesProvider =
        selectedProvider === "all"
          ? true
          : model.endpoints.some((ep) => ep.provider === selectedProvider);

      // Author filter
      const matchesAuthor =
        selectedAuthor === "all" ? true : model.author === selectedAuthor;

      // Context size filter
      const matchesContext = (() => {
        switch (contextFilter) {
          case "small": return model.contextLength <= 32000;
          case "medium": return model.contextLength > 32000 && model.contextLength <= 128000;
          case "large": return model.contextLength > 128000 && model.contextLength <= 200000;
          case "xlarge": return model.contextLength > 200000;
          default: return true;
        }
      })();

      // Price filter
      const minCost = Math.min(...model.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
      const matchesPrice = (() => {
        const avgDollarsPerM = minCost / 1000000 * 1000; // Convert to per million
        switch (priceFilter) {
          case "free": return avgDollarsPerM === 0;
          case "cheap": return avgDollarsPerM > 0 && avgDollarsPerM <= 0.5;
          case "moderate": return avgDollarsPerM > 0.5 && avgDollarsPerM <= 5;
          case "expensive": return avgDollarsPerM > 5;
          default: return true;
        }
      })();

      // Capability filters
      const matchesCapabilities = 
        (!capabilityFilters.vision || model.capabilities?.vision) &&
        (!capabilityFilters.functionCalling || model.capabilities?.functionCalling) &&
        (!capabilityFilters.jsonMode || model.capabilities?.jsonMode) &&
        (!capabilityFilters.streaming || model.capabilities?.streaming);

      return matchesSearch && matchesProvider && matchesAuthor && matchesContext && matchesPrice && matchesCapabilities;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          const aMin = Math.min(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
          const bMin = Math.min(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
          return aMin - bMin;
        case "price-high":
          const aMax = Math.max(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
          const bMax = Math.max(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2));
          return bMax - aMax;
        case "context":
          return b.contextLength - a.contextLength;
        case "value":
          // Sort by quality/price ratio (simplified)
          const aValue = (a.quality === 'high' ? 3 : a.quality === 'medium' ? 2 : 1) / 
                         Math.max(0.01, Math.min(...a.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2)) / 1000000);
          const bValue = (b.quality === 'high' ? 3 : b.quality === 'medium' ? 2 : 1) / 
                         Math.max(0.01, Math.min(...b.endpoints.map(e => (e.pricing.prompt + e.pricing.completion) / 2)) / 1000000);
          return bValue - aValue;
        case "speed":
          const speedOrder = { 'fast': 1, 'medium': 2, 'slow': 3 };
          return (speedOrder[a.speed || 'medium'] || 2) - (speedOrder[b.speed || 'medium'] || 2);
        case "newest":
          return (b.trainingDate || '').localeCompare(a.trainingDate || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [models, searchQuery, selectedProvider, selectedAuthor, sortBy, contextFilter, priceFilter, capabilityFilters]);

  const formatCost = (cost: number) => {
    const dollarsPerM = (cost / 1000000) * 1000; // Convert to per million
    if (dollarsPerM === 0) return "Free";
    if (dollarsPerM < 1) return `$${dollarsPerM.toFixed(2)}/M`;
    return `$${dollarsPerM.toFixed(1)}/M`;
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

  const copyModelId = (modelId: string) => {
    navigator.clipboard.writeText(modelId);
    setCopiedModel(modelId);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Clean Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-black dark:bg-white rounded-lg">
                <Cpu className="h-5 w-5 text-white dark:text-black" />
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                Model Registry
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Compare {models.length} language models across {allProviders.length} providers
            </p>
          </div>

          {/* Enhanced Filters */}
          <div className="mb-6 space-y-4">
            {/* Search and main filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search models, providers, or capabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>
              
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Provider" />
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

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="value">Best Value</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="context">Context Size</SelectItem>
                  <SelectItem value="speed">Speed</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional filters */}
            <div className="flex flex-wrap gap-4">
              {/* Context size filter */}
              <Select value={contextFilter} onValueChange={(v) => setContextFilter(v as ContextFilter)}>
                <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Context Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">≤32K</SelectItem>
                  <SelectItem value="medium">32K-128K</SelectItem>
                  <SelectItem value="large">128K-200K</SelectItem>
                  <SelectItem value="xlarge">200K+</SelectItem>
                </SelectContent>
              </Select>

              {/* Price filter */}
              <Select value={priceFilter} onValueChange={(v) => setPriceFilter(v as PriceFilter)}>
                <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="cheap">Under $0.5/M</SelectItem>
                  <SelectItem value="moderate">$0.5-$5/M</SelectItem>
                  <SelectItem value="expensive">Over $5/M</SelectItem>
                </SelectContent>
              </Select>

              {/* Capability checkboxes */}
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox 
                    checked={capabilityFilters.vision}
                    onCheckedChange={(checked) => 
                      setCapabilityFilters(prev => ({ ...prev, vision: checked as boolean }))}
                  />
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-sm">Vision</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox 
                    checked={capabilityFilters.functionCalling}
                    onCheckedChange={(checked) => 
                      setCapabilityFilters(prev => ({ ...prev, functionCalling: checked as boolean }))}
                  />
                  <Code className="h-3.5 w-3.5" />
                  <span className="text-sm">Functions</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox 
                    checked={capabilityFilters.jsonMode}
                    onCheckedChange={(checked) => 
                      setCapabilityFilters(prev => ({ ...prev, jsonMode: checked as boolean }))}
                  />
                  <FileJson className="h-3.5 w-3.5" />
                  <span className="text-sm">JSON</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Showing {processedModels.length} of {models.length} models
          </div>

          {/* Enhanced Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Capabilities
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Speed / Quality
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Context
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price / Million
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Providers
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {processedModels.map((model) => {
                    const minInputCost = Math.min(...model.endpoints.map(e => e.pricing.prompt));
                    const minOutputCost = Math.min(...model.endpoints.map(e => e.pricing.completion));
                    const avgCost = (minInputCost + minOutputCost) / 2;
                    const isFree = minInputCost === 0;
                    const isNew = model.name.includes('3.7') || model.name.includes('2.0') || model.name.includes('3.3');
                    const cheapestProvider = model.endpoints.reduce((min, ep) => 
                      (ep.pricing.prompt + ep.pricing.completion) / 2 < (min.pricing.prompt + min.pricing.completion) / 2 ? ep : min
                    );
                    
                    return (
                      <tr 
                        key={model.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {model.name}
                              </span>
                              {isFree && (
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
                                  Free
                                </Badge>
                              )}
                              {isNew && !isFree && (
                                <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                                  New
                                </Badge>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-medium mb-1">{model.name}</p>
                                    <p className="text-gray-600">{model.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">Training data: {model.trainingDate}</p>
                                    <p className="text-xs text-gray-500">Max output: {model.maxOutput?.toLocaleString()} tokens</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {model.author.charAt(0).toUpperCase() + model.author.slice(1).replace(/-/g, ' ')}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="flex gap-1.5">
                            {model.capabilities?.vision && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>Vision capable</TooltipContent>
                              </Tooltip>
                            )}
                            {model.capabilities?.functionCalling && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>Function calling</TooltipContent>
                              </Tooltip>
                            )}
                            {model.capabilities?.jsonMode && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <FileJson className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>JSON mode</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Gauge className="h-3.5 w-3.5 text-gray-400" />
                              <span className={`text-xs font-medium ${
                                model.speed === 'fast' ? 'text-green-600 dark:text-green-400' :
                                model.speed === 'slow' ? 'text-orange-600 dark:text-orange-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>
                                {model.speed === 'fast' ? 'Fast' : model.speed === 'slow' ? 'Slow' : 'Medium'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {model.quality === 'high' ? '⭐⭐⭐' : model.quality === 'medium' ? '⭐⭐' : '⭐'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {formatContext(model.contextLength)}
                          </span>
                        </td>
                        
                        <td className="px-4 py-4 text-right">
                          <div>
                            <div className={`text-sm font-mono font-medium ${
                              isFree ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {formatCost(avgCost)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              in: {formatCost(minInputCost)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {model.endpoints.slice(0, 2).map((endpoint, idx) => (
                                <span 
                                  key={idx}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    endpoint === cheapestProvider 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                  }`}
                                >
                                  {endpoint.provider}
                                </span>
                              ))}
                              {model.endpoints.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                      +{model.endpoints.length - 2}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      {model.endpoints.slice(2).map(ep => ep.provider).join(', ')}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4">
                          <button
                            onClick={() => copyModelId(model.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            {copiedModel === model.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {processedModels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No models found matching your criteria
              </p>
            </div>
          )}

          {/* Simple Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prices shown are blended average per million tokens. Green highlight indicates cheapest provider.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}