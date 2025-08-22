"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useJawnClient } from "@/lib/clients/jawnHook";
import Head from "next/head";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown, Clipboard, Check, ChevronDown, X } from "lucide-react";
import { Small, Muted } from "@/components/ui/typography";
import { Slider } from "@/components/ui/slider";

interface ModelEndpoint {
  provider: string;
  providerSlug: string;
  pricing: {
    prompt: number; // per million tokens
    completion: number; // per million tokens
    audio?: number; // per million tokens, if > 0
    web_search?: number; // per million tokens, if > 0
    video?: number; // per million tokens, if > 0
    image?: number; // per million tokens, if > 0
    thinking?: number; // per million tokens, if > 0
    cacheRead?: number; // per million tokens, if > 0
    cacheWrite?: number; // per million tokens, if > 0
  };
  supportsPtb?: boolean;
}

type InputModality = "text" | "image" | "audio" | "video";
type OutputModality = "text" | "image" | "audio" | "video";
type StandardParameter = "max_tokens" | "temperature" | "top_p" | "top_k" | "stop" | "stream" | "frequency_penalty" | "presence_penalty" | "repetition_penalty" | "seed" | "tools" | "tool_choice" | "functions" | "function_call" | "reasoning" | "include_reasoning" | "thinking" | "response_format" | "json_mode" | "truncate" | "min_p" | "logit_bias" | "logprobs" | "top_logprobs" | "structured_outputs";

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

type SortOption = "name" | "price-low" | "price-high" | "context" | "newest";
type ContextFilter = "all" | "small" | "medium" | "large" | "xlarge";
type PriceFilter = "all" | "free" | "cheap" | "moderate" | "expensive";

export function ModelRegistryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  // Sidebar filter states
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(
    new Set()
  );
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(
    new Set()
  );
  // Price range: [min, max] in dollars per million tokens
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  // Context size: minimum tokens (in thousands)
  const [minContextSize, setMinContextSize] = useState<number>(0);
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(
    new Set()
  );
  const [selectedInputModalities, setSelectedInputModalities] = useState<Set<InputModality>>(
    new Set()
  );
  const [selectedParameters, setSelectedParameters] = useState<Set<StandardParameter>>(
    new Set()
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["providers", "price", "context", "capabilities", "modalities", "parameters"])
  );

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  // URL state management
  const serializeFiltersToURL = () => {
    const params = new URLSearchParams();
    
    if (selectedProviders.size > 0) {
      params.set('providers', Array.from(selectedProviders).join(','));
    }
    if (priceRange[0] > 0 || priceRange[1] < priceStats.max) {
      params.set('price', `${priceRange[0]}-${priceRange[1]}`);
    }
    if (minContextSize > 0) {
      params.set('context', minContextSize.toString());
    }
    if (selectedCapabilities.size > 0) {
      params.set('capabilities', Array.from(selectedCapabilities).join(','));
    }
    if (selectedInputModalities.size > 0) {
      params.set('modalities', Array.from(selectedInputModalities).join(','));
    }
    if (selectedParameters.size > 0) {
      params.set('parameters', Array.from(selectedParameters).join(','));
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (sortBy !== 'name') {
      params.set('sort', sortBy);
    }
    
    return params.toString();
  };

  const initializeFromURL = () => {
    const providers = searchParams.get('providers');
    if (providers) {
      setSelectedProviders(new Set(providers.split(',')));
    }
    
    const price = searchParams.get('price');
    if (price && price.includes('-')) {
      const [min, max] = price.split('-').map(Number);
      setPriceRange([min, max]);
    }
    
    const context = searchParams.get('context');
    if (context) {
      setMinContextSize(Number(context));
    }
    
    const capabilities = searchParams.get('capabilities');
    if (capabilities) {
      setSelectedCapabilities(new Set(capabilities.split(',')));
    }
    
    const modalities = searchParams.get('modalities');
    if (modalities) {
      setSelectedInputModalities(new Set(modalities.split(',') as InputModality[]));
    }
    
    const parameters = searchParams.get('parameters');
    if (parameters) {
      setSelectedParameters(new Set(parameters.split(',') as StandardParameter[]));
    }
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    
    const sort = searchParams.get('sort') as SortOption;
    if (sort) {
      setSortBy(sort);
    }
  };

  const updateURL = () => {
    const params = serializeFiltersToURL();
    const newUrl = params ? `${window.location.pathname}?${params}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  };

  const jawnClient = useJawnClient();

  useEffect(() => {
    async function loadData() {
      try {
        const response = await jawnClient.GET(
          "/v1/public/model-registry/models"
        );
        if (response.data?.data) {
          setModels(response.data.data.models || []);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []); // Remove jawnClient from dependencies

  const { allProviders, allAuthors, priceStats, contextStats } = useMemo(() => {
    const providers = new Set<string>();
    const authors = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let minContext = Infinity;
    let maxContext = 0;

    models.forEach((model) => {
      authors.add(model.author);
      
      // Calculate min cost for this model
      const modelMinCost = Math.min(
        ...model.endpoints.map(
          (e) => (e.pricing.prompt + e.pricing.completion) / 2
        )
      );
      
      if (modelMinCost < minPrice) minPrice = modelMinCost;
      if (modelMinCost > maxPrice) maxPrice = modelMinCost;
      
      // Context size
      if (model.contextLength < minContext) minContext = model.contextLength;
      if (model.contextLength > maxContext) maxContext = model.contextLength;
      
      model.endpoints.forEach((endpoint) => {
        providers.add(endpoint.provider);
      });
    });

    return {
      allProviders: Array.from(providers).sort(),
      allAuthors: Array.from(authors).sort(),
      priceStats: { 
        min: minPrice === Infinity ? 0 : minPrice, 
        max: maxPrice === 0 ? 50 : Math.ceil(maxPrice) 
      },
      contextStats: { 
        min: minContext === Infinity ? 0 : minContext, 
        max: maxContext === 0 ? 1000000 : maxContext 
      },
    };
  }, [models]);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (models.length > 0 && priceStats.max > 0) {
      initializeFromURL();
    }
  }, [models.length, priceStats.max]); // Wait for models and stats to be loaded

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
        selectedProviders.size === 0 ||
        model.endpoints.some((ep) => selectedProviders.has(ep.provider));

      // Author filter
      const matchesAuthor =
        selectedAuthors.size === 0 || selectedAuthors.has(model.author);

      // Context size filter - minimum threshold
      const matchesContext = model.contextLength >= minContextSize;

      // Price filter - within range
      const minCost = Math.min(
        ...model.endpoints.map(
          (e) => (e.pricing.prompt + e.pricing.completion) / 2
        )
      );
      const matchesPrice = minCost >= priceRange[0] && minCost <= priceRange[1];

      // Capabilities filter
      // Focus on user-facing capabilities only (like OpenRouter)
      const modelCapabilities = new Set<string>();
      model.endpoints.forEach((ep) => {
        if (ep.pricing.audio && ep.pricing.audio > 0)
          modelCapabilities.add("audio");
        if (ep.pricing.video && ep.pricing.video > 0)
          modelCapabilities.add("video");
        if (ep.pricing.thinking && ep.pricing.thinking > 0)
          modelCapabilities.add("thinking");
        if (ep.pricing.web_search && ep.pricing.web_search > 0)
          modelCapabilities.add("web_search");
        if (ep.pricing.image && ep.pricing.image > 0)
          modelCapabilities.add("image");
        // Skip cache capabilities - too technical
      });
      const matchesCapabilities =
        selectedCapabilities.size === 0 ||
        Array.from(selectedCapabilities).some((cap) =>
          modelCapabilities.has(cap)
        );

      // Input modalities filter
      const matchesModalities =
        selectedInputModalities.size === 0 ||
        Array.from(selectedInputModalities).some((modality) =>
          model.inputModalities.includes(modality)
        );

      // Supported parameters filter
      const matchesParameters =
        selectedParameters.size === 0 ||
        Array.from(selectedParameters).some((parameter) =>
          model.supportedParameters.includes(parameter)
        );

      return (
        matchesSearch &&
        matchesProvider &&
        matchesAuthor &&
        matchesContext &&
        matchesPrice &&
        matchesCapabilities &&
        matchesModalities &&
        matchesParameters
      );
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          const aMin = Math.min(
            ...a.endpoints.map(
              (e) => (e.pricing.prompt + e.pricing.completion) / 2
            )
          );
          const bMin = Math.min(
            ...b.endpoints.map(
              (e) => (e.pricing.prompt + e.pricing.completion) / 2
            )
          );
          return aMin - bMin;
        case "price-high":
          const aMax = Math.max(
            ...a.endpoints.map(
              (e) => (e.pricing.prompt + e.pricing.completion) / 2
            )
          );
          const bMax = Math.max(
            ...b.endpoints.map(
              (e) => (e.pricing.prompt + e.pricing.completion) / 2
            )
          );
          return bMax - aMax;
        case "context":
          return b.contextLength - a.contextLength;
        case "newest":
          return (b.trainingDate || "").localeCompare(a.trainingDate || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    models,
    searchQuery,
    selectedProviders,
    selectedAuthors,
    priceRange,
    minContextSize,
    selectedCapabilities,
    selectedInputModalities,
    selectedParameters,
    sortBy,
  ]);

  // Debounced URL update when filters change
  useEffect(() => {
    if (models.length > 0 && priceStats.max > 0) {
      const timeoutId = setTimeout(() => {
        updateURL();
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    selectedProviders,
    priceRange,
    minContextSize,
    selectedCapabilities,
    selectedInputModalities,
    selectedParameters,
    searchQuery,
    sortBy,
    models.length,
    priceStats.max,
  ]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-white dark:bg-gray-900 rounded"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Model Registry
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare {models.length} language models across {allProviders.length}{" "}
            providers
          </p>
        </div>

        {/* Search and Sort */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search models, providers, or capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {processedModels.length} of {models.length} models
              </span>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
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

        {/* Filter Toggle Button - Mobile Only */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
              />
            </svg>
            Filters
            {selectedProviders.size +
              (priceRange[0] > 0 || priceRange[1] < priceStats.max ? 1 : 0) +
              (minContextSize > 0 ? 1 : 0) +
              selectedCapabilities.size +
              selectedInputModalities.size +
              selectedParameters.size >
              0 && (
              <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-0.5 rounded-full">
                {selectedProviders.size +
                  (priceRange[0] > 0 || priceRange[1] < priceStats.max ? 1 : 0) +
                  (minContextSize > 0 ? 1 : 0) +
                  selectedCapabilities.size +
                  selectedInputModalities.size +
                  selectedParameters.size}
              </span>
            )}
          </button>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div
            className={`w-80 flex-shrink-0 ${sidebarOpen ? "block" : "hidden"} lg:block`}
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
              <div className="p-6">
              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>


              {/* Provider Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("providers")}
                  className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
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
                    {allProviders.map((provider) => {
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
                          className={`flex items-center justify-between px-2 py-1.5 text-sm font-light rounded cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                              : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span>{provider}</span>
                          {isSelected && (
                            <X className="h-3 w-3" />
                          )}
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
                  className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
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
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>${priceRange[0].toFixed(2)}</span>
                      <span>${priceRange[1].toFixed(2)} per M tokens</span>
                    </div>
                    <div className="relative">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={priceStats.max}
                        step={0.1}
                        className="mb-2"
                      />
                      {/* Price tick marks */}
                      <div className="absolute top-6 w-full flex justify-between px-0.5">
                        {[0, 0.5, 1, 2, 5, 10, priceStats.max].filter((tick, index, arr) => tick <= priceStats.max && arr.indexOf(tick) === index).map((tick) => (
                          <div key={tick} className="flex flex-col items-center">
                            <div className="w-px h-2 bg-gray-300 dark:bg-gray-600"></div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {tick === 0 ? 'FREE' : `$${tick}${tick >= 10 ? '+' : ''}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Context Size Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("context")}
                  className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
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
                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Minimum: {minContextSize >= 1000 ? `${(minContextSize / 1000).toFixed(0)}K` : minContextSize} tokens or higher
                    </div>
                    <div className="relative">
                      <Slider
                        value={[minContextSize]}
                        onValueChange={([value]) => setMinContextSize(value)}
                        min={0}
                        max={contextStats.max}
                        step={1000}
                        className="mb-2"
                      />
                      {/* Context tick marks */}
                      <div className="absolute top-6 w-full flex justify-between px-0.5">
                        {[0, 4000, 32000, 128000, 200000, 1000000].filter(tick => tick <= contextStats.max).map((tick) => (
                          <div key={tick} className="flex flex-col items-center">
                            <div className="w-px h-2 bg-gray-300 dark:bg-gray-600"></div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {tick === 0 ? '0' : tick >= 1000000 ? `${(tick / 1000000).toFixed(0)}M` : `${(tick / 1000).toFixed(0)}K`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Capabilities Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("capabilities")}
                  className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
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
                    {[
                      { key: "audio", label: "Audio Processing", icon: "🎧" },
                      { key: "video", label: "Video Processing", icon: "🎥" },
                      { key: "thinking", label: "Chain-of-Thought", icon: "🧠" },
                      { key: "web_search", label: "Web Search", icon: "🔍" },
                      { key: "image", label: "Image Processing", icon: "🖼️" },
                    ]
                      .map(({ key, label, icon }) => {
                        // Check if any models have this capability
                        const hasCapability = models.some((m) =>
                          m.endpoints.some((ep) => {
                            switch (key) {
                              case "audio": return ep.pricing.audio && ep.pricing.audio > 0;
                              case "video": return ep.pricing.video && ep.pricing.video > 0;
                              case "thinking": return ep.pricing.thinking && ep.pricing.thinking > 0;
                              case "web_search": return ep.pricing.web_search && ep.pricing.web_search > 0;
                              case "image": return ep.pricing.image && ep.pricing.image > 0;
                              default: return false;
                            }
                          })
                        );

                        if (!hasCapability) return null;
                        const isSelected = selectedCapabilities.has(key);
                        
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              const newSet = new Set(selectedCapabilities);
                              if (isSelected) {
                                newSet.delete(key);
                              } else {
                                newSet.add(key);
                              }
                              setSelectedCapabilities(newSet);
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected 
                                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" 
                                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{icon}</span>
                              <span className="text-sm font-light">{label}</span>
                            </div>
                            {isSelected && <X className="h-3 w-3" />}
                          </div>
                        );
                      })
                      .filter(Boolean)}
                  </div>
                )}
              </div>

              {/* Input Modalities Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("modalities")}
                  className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>Input Modalities</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedSections.has("modalities") ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedSections.has("modalities") && (
                  <div className="space-y-1">
                    {[
                      { key: "text" as InputModality, label: "Text", icon: "📝" },
                      { key: "image" as InputModality, label: "Image", icon: "🖼️" },
                      { key: "audio" as InputModality, label: "Audio", icon: "🎵" },
                      { key: "video" as InputModality, label: "Video", icon: "🎬" },
                    ]
                      .map(({ key, label, icon }) => {
                        // Check if any models support this input modality
                        const hasModality = models.some((m) =>
                          m.inputModalities.includes(key)
                        );
                        
                        if (!hasModality) return null;
                        
                        const isSelected = selectedInputModalities.has(key);
                        
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              const newSet = new Set(selectedInputModalities);
                              if (isSelected) {
                                newSet.delete(key);
                              } else {
                                newSet.add(key);
                              }
                              setSelectedInputModalities(newSet);
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected 
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{icon}</span>
                              <span className="text-sm font-light">{label}</span>
                            </div>
                            {isSelected && <X className="h-3 w-3" />}
                          </div>
                        );
                      })
                      .filter(Boolean)}
                  </div>
                )}
              </div>

              {/* Supported Parameters Filter */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection("parameters")}
                  className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>Supported Parameters</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedSections.has("parameters") ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedSections.has("parameters") && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {[
                      { key: "tools" as StandardParameter, label: "Function Calling" },
                      { key: "response_format" as StandardParameter, label: "Structured Output" },
                      { key: "temperature" as StandardParameter, label: "Temperature" },
                      { key: "top_p" as StandardParameter, label: "Top-p Sampling" },
                      { key: "max_tokens" as StandardParameter, label: "Max Tokens" },
                      { key: "stop" as StandardParameter, label: "Stop Sequences" },
                      { key: "seed" as StandardParameter, label: "Seed" },
                      { key: "frequency_penalty" as StandardParameter, label: "Frequency Penalty" },
                      { key: "presence_penalty" as StandardParameter, label: "Presence Penalty" },
                      { key: "logprobs" as StandardParameter, label: "Log Probabilities" },
                    ]
                      .map(({ key, label }) => {
                        // Check if any models support this parameter
                        const hasParameter = models.some((m) =>
                          m.supportedParameters.includes(key)
                        );
                        
                        if (!hasParameter) return null;
                        
                        const isSelected = selectedParameters.has(key);
                        
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              const newSet = new Set(selectedParameters);
                              if (isSelected) {
                                newSet.delete(key);
                              } else {
                                newSet.add(key);
                              }
                              setSelectedParameters(newSet);
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected 
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" 
                                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-light">{label}</span>
                            </div>
                            {isSelected && <X className="h-3 w-3" />}
                          </div>
                        );
                      })
                      .filter(Boolean)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Table */}
          <div className="flex-1 min-w-0">
            {/* Clean Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <tbody>
                    {processedModels.map((model) => {
                      const minInputCost = Math.min(
                        ...model.endpoints.map((e) => e.pricing.prompt)
                      );
                      const minOutputCost = Math.min(
                        ...model.endpoints.map((e) => e.pricing.completion)
                      );
                      const isFree = minInputCost === 0;
                      const cheapestProvider = model.endpoints.reduce(
                        (min, ep) =>
                          (ep.pricing.prompt + ep.pricing.completion) / 2 <
                          (min.pricing.prompt + min.pricing.completion) / 2
                            ? ep
                            : min
                      );

                      // Get capabilities with pricing from cheapest provider
                      const capabilities: {
                        key: string;
                        icon: string;
                        label: string;
                        cost: string;
                      }[] = [];
                      const pricing = cheapestProvider.pricing;

                      if (pricing.audio && pricing.audio > 0) {
                        capabilities.push({
                          key: "audio",
                          icon: "🎧",
                          label: "Audio",
                          cost: formatCost(pricing.audio),
                        });
                      }
                      if (pricing.video && pricing.video > 0) {
                        capabilities.push({
                          key: "video",
                          icon: "🎥",
                          label: "Video",
                          cost: formatCost(pricing.video),
                        });
                      }
                      if (pricing.thinking && pricing.thinking > 0) {
                        capabilities.push({
                          key: "thinking",
                          icon: "🧠",
                          label: "Reasoning",
                          cost: formatCost(pricing.thinking),
                        });
                      }
                      if (pricing.web_search && pricing.web_search > 0) {
                        capabilities.push({
                          key: "search",
                          icon: "🔍",
                          label: "Web Search",
                          cost: formatCost(pricing.web_search),
                        });
                      }
                      if (pricing.image && pricing.image > 0) {
                        capabilities.push({
                          key: "vision",
                          icon: "👁️",
                          label: "Vision",
                          cost: formatCost(pricing.image),
                        });
                      }

                      return (
                        <tbody key={model.id} className="group cursor-pointer">
                          {/* Row 1: Primary info */}
                          <tr className="border-t-4 border-transparent group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50">
                            {/* Model name with copy button */}
                            <td className="px-6 pt-6 pb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-normal text-gray-900 dark:text-gray-100">
                                  {model.name}
                                </span>
                                <button
                                  onClick={() => copyModelId(model.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                  title={`Copy model ID: ${model.id}`}
                                >
                                  {copiedModel === model.id ? (
                                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Clipboard className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                {isFree && (
                                  <span className="text-xs font-normal text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                                    Free
                                  </span>
                                )}
                              </div>
                            </td>

                          </tr>

                          {/* Row 2: Secondary info */}
                          <tr className="group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50">
                            <td className="px-6 pt-1 pb-6">
                              <div className="space-y-2">
                                {/* Description first - truncated with ellipsis */}
                                {model.description && (
                                  <div className="text-base font-light text-gray-400 dark:text-gray-500">
                                    {model.description.length > 150
                                      ? `${model.description.slice(0, 150)}...`
                                      : model.description}
                                  </div>
                                )}
                                
                                {/* Author, Context, and Pricing - same light text as description */}
                                <div className="flex flex-wrap items-center gap-3 text-sm font-light text-gray-400 dark:text-gray-500">
                                  <div>
                                    by{" "}
                                    <a
                                      href={`/authors/${model.author.toLowerCase().replace(/\s+/g, "-")}`}
                                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 underline"
                                    >
                                      {model.author.charAt(0).toUpperCase() +
                                        model.author
                                          .slice(1)
                                          .replace(/-/g, " ")}
                                    </a>
                                  </div>
                                  <div>•</div>
                                  <div>
                                    {formatContext(model.contextLength)} context
                                  </div>
                                  <div>•</div>
                                  <div>
                                    ${minInputCost === 0 ? '0' : minInputCost < 1 ? minInputCost.toFixed(2) : minInputCost.toFixed(1)}/M in, ${minOutputCost === 0 ? '0' : minOutputCost < 1 ? minOutputCost.toFixed(2) : minOutputCost.toFixed(1)}/M out
                                  </div>
                                  {model.maxOutput && (
                                    <>
                                      <div>•</div>
                                      <div>
                                        {formatContext(model.maxOutput)} max output
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Subtle divider between models */}
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
                Prices shown are per million tokens from cheapest available
                provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
