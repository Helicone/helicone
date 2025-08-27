"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getJawnClient } from "@/lib/clients/jawn";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUpDown,
  Clipboard,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useModelFiltering } from "@/hooks/useModelFiltering";
import { Model, SortOption } from "@/lib/filters/modelFilters";

interface ModelRegistryResponse {
  models: Model[];
  total: number;
  filters: {
    providers: string[];
    authors: string[];
    capabilities: string[];
  };
}

export function ModelRegistryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Memoize the jawn client to prevent recreating on every render
  const jawnClient = useMemo(() => getJawnClient(), []);

  // State for all models (fetched once)
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  // Filter states from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(
    new Set(searchParams.get("providers")?.split(",").filter(Boolean) || [])
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("priceMin") || 0),
    Number(searchParams.get("priceMax") || 50),
  ]);
  const [minContextSize, setMinContextSize] = useState<number>(
    Number(searchParams.get("contextMin") || 0)
  );
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(
    new Set(searchParams.get("capabilities")?.split(",").filter(Boolean) || [])
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "name"
  );

  // Use client-side filtering hook
  const { filteredModels, totalModels, availableFilters, isFiltered } = useModelFiltering({
    models: allModels,
    search: searchQuery,
    selectedProviders,
    priceRange,
    minContextSize,
    selectedCapabilities,
    sortBy,
  });

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["providers", "price", "context", "capabilities"])
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  // Fetch all models once on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        
        const response = await jawnClient.GET("/v1/public/model-registry/models");

        if (response.data?.data) {
          const data = response.data.data as ModelRegistryResponse;
          setAllModels(data.models);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [jawnClient]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("search", searchQuery);
    if (selectedProviders.size > 0) {
      params.set("providers", Array.from(selectedProviders).sort().join(','));
    }
    if (priceRange[0] > 0) params.set("priceMin", priceRange[0].toString());
    if (priceRange[1] < 50) params.set("priceMax", priceRange[1].toString());
    if (minContextSize > 0) params.set("contextMin", minContextSize.toString());
    if (selectedCapabilities.size > 0) {
      params.set("capabilities", Array.from(selectedCapabilities).sort().join(','));
    }
    if (sortBy !== "name") params.set("sort", sortBy);
    
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    router.push(newUrl, { scroll: false });
  }, [searchQuery, selectedProviders, priceRange, minContextSize, selectedCapabilities, sortBy, router]);

  const formatCost = (costPerMillion: number) => {
    if (costPerMillion === 0) return "Free";
    if (costPerMillion < 1) return `$${costPerMillion.toFixed(2)}/M`;
    return `$${costPerMillion.toFixed(1)}/M`;
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Model Registry
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {loading ? (
              <span className="animate-pulse">Loading models...</span>
            ) : (
              `${totalModels} models across ${availableFilters.providers.length} providers`
            )}
          </p>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className={`w-80 flex-shrink-0 ${sidebarOpen ? "block" : "hidden"} lg:block`}>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="p-6">
                {/* Provider Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("providers")}
                    className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3"
                  >
                    <span>Providers</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedSections.has("providers") ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSections.has("providers") && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableFilters.providers.map((provider) => {
                        const isSelected = selectedProviders.has(provider);
                        return (
                          <div
                            key={provider}
                            onClick={() => {
                              const newSet = new Set(selectedProviders);
                              if (isSelected) {
                                newSet.delete(provider);
                              } else {
                                newSet.add(provider);
                              }
                              setSelectedProviders(newSet);
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 text-sm rounded cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <span className="truncate flex-1 mr-2">{provider}</span>
                            {isSelected && <X className="h-3 w-3" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("price")}
                    className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3"
                  >
                    <span>Price Range</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedSections.has("price") ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSections.has("price") && (
                    <div className="px-2 pb-2">
                      <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>${priceRange[0].toFixed(2)}</span>
                        <span>${priceRange[1].toFixed(2)} per M tokens</span>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={0}
                        max={50}
                        step={0.1}
                        className="mb-1"
                      />
                    </div>
                  )}
                </div>

                {/* Context Size Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("context")}
                    className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3"
                  >
                    <span>Context Size</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedSections.has("context") ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSections.has("context") && (
                    <div className="px-2 pb-2">
                      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                        Minimum: {minContextSize >= 1000
                          ? `${(minContextSize / 1000).toFixed(0)}K`
                          : minContextSize} tokens
                      </div>
                      <Slider
                        value={[minContextSize]}
                        onValueChange={([value]) => setMinContextSize(value)}
                        min={0}
                        max={1000000}
                        step={1000}
                        className="mb-1"
                      />
                    </div>
                  )}
                </div>

                {/* Capabilities Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("capabilities")}
                    className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3"
                  >
                    <span>Special Capabilities</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedSections.has("capabilities") ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSections.has("capabilities") && (
                    <div className="space-y-1">
                      {availableFilters.capabilities.map((capability) => {
                        const isSelected = selectedCapabilities.has(capability);
                        const labelMap: Record<string, string> = {
                          audio: "Audio Processing",
                          video: "Video Processing",
                          thinking: "Chain-of-Thought",
                          web_search: "Web Search",
                          image: "Image Processing",
                          caching: "Caching",
                          reasoning: "Reasoning",
                        };
                        
                        return (
                          <div
                            key={capability}
                            onClick={() => {
                              const newSet = new Set(selectedCapabilities);
                              if (isSelected) {
                                newSet.delete(capability);
                              } else {
                                newSet.add(capability);
                              }
                              setSelectedCapabilities(newSet);
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <span className="text-sm font-light truncate flex-1 mr-2">
                              {labelMap[capability] || capability}
                            </span>
                            {isSelected && <X className="h-3 w-3" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Table */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort */}
            <div className="mb-6">
              <div className="flex flex-col gap-3">
                {/* Model count */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredModels.length} of {totalModels} models
                  </span>
                  {/* Reset filters button - always rendered to prevent layout shift */}
                  <button
                    onClick={() => {
                      setSelectedProviders(new Set());
                      setPriceRange([0, 50]);
                      setMinContextSize(0);
                      setSelectedCapabilities(new Set());
                      setSearchQuery("");
                    }}
                    className={`px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg transition-all flex items-center gap-2 ${
                      isFiltered
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset filters
                  </button>
                </div>

                {/* Search bar and sort */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortOption)}
                  >
                    <SelectTrigger className="w-[160px] h-10">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="context">Context Size</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Models Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <tbody>
                    {filteredModels.map((model) => {
                      const minInputCost = Math.min(
                        ...model.endpoints.map((e) => e.pricing.prompt)
                      );
                      const minOutputCost = Math.min(
                        ...model.endpoints.map((e) => e.pricing.completion)
                      );
                      const isFree = minInputCost === 0;

                      return (
                        <tbody key={model.id} className="group cursor-pointer">
                          <tr 
                            className="border-t-4 border-transparent group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50"
                            onClick={(e) => {
                              if (!(e.target as HTMLElement).closest('button')) {
                                router.push(`/model/${encodeURIComponent(model.id)}`);
                              }
                            }}
                          >
                            <td className="px-6 pt-6 pb-1">
                              <div className="flex items-center gap-2">
                                <Link 
                                  href={`/model/${encodeURIComponent(model.id)}`}
                                  className="text-lg font-normal text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {model.name.replace(
                                    new RegExp(`^${model.author}:\s*`, "i"),
                                    ""
                                  )}
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyModelId(model.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                                  title={`Copy model ID: ${model.id}`}
                                >
                                  {copiedModel === model.id ? (
                                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Clipboard className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                {isFree && (
                                  <span className="text-xs font-normal text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-2.5 py-1 rounded-full">
                                    Free
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                          
                          <tr 
                            className="group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50"
                            onClick={() => router.push(`/model/${encodeURIComponent(model.id)}`)}
                          >
                            <td className="px-6 pt-1 pb-6">
                              <div className="space-y-2">
                                {model.description && (
                                  <div className="text-base font-light text-gray-400 dark:text-gray-500">
                                    {model.description.length > 150
                                      ? `${model.description.slice(0, 150)}...`
                                      : model.description}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-sm font-light text-gray-400 dark:text-gray-500">
                                  <div>by {model.author}</div>
                                  <div>•</div>
                                  <div>{formatContext(model.contextLength)} context</div>
                                  <div>•</div>
                                  <div>
                                    ${minInputCost < 1 ? minInputCost.toFixed(2) : minInputCost.toFixed(1)}/M in,{" "}
                                    ${minOutputCost < 1 ? minOutputCost.toFixed(2) : minOutputCost.toFixed(1)}/M out
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                          
                          <tr>
                            <td className="px-6 py-2">
                              <div className="border-b border-gray-100 dark:border-gray-800/50 mx-12"></div>
                            </td>
                          </tr>
                        </tbody>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredModels.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No models found matching your criteria
                </p>
              </div>
            )}
            
            {loading && (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}