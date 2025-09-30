"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getJawnClient } from "@/lib/clients/jawn";
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
  X,
  Filter,
  Info,
} from "lucide-react";
import { useModelFiltering } from "@/hooks/useModelFiltering";
import { Model, SortOption } from "@/lib/filters/modelFilters";
import { components } from "@/lib/clients/jawnTypes/public";
import { FilterSection } from "@/components/ui/filters/FilterSection";
import { FilterOption } from "@/components/ui/filters/FilterOption";
import { SliderFilter } from "@/components/ui/filters/SliderFilter";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/ui/CopyButton";

type ModelRegistryResponse = components["schemas"]["ModelRegistryResponse"];

export function ModelRegistryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize the jawn client to prevent recreating on every render
  const jawnClient = useMemo(() => getJawnClient(), []);

  // State for all models (fetched once)
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states from URL
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
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
  const [showPtbOnly, setShowPtbOnly] = useState<boolean>(
    searchParams.get("ptb") === "true"
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );

  // Use client-side filtering hook
  const { filteredModels, totalModels, availableFilters, isFiltered } =
    useModelFiltering({
      models: allModels,
      search: searchQuery,
      selectedProviders,
      priceRange,
      minContextSize,
      selectedCapabilities,
      showPtbOnly,
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

        const response = await jawnClient.GET(
          "/v1/public/model-registry/models"
        );

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
      params.set("providers", Array.from(selectedProviders).sort().join(","));
    }
    if (priceRange[0] > 0) params.set("priceMin", priceRange[0].toString());
    if (priceRange[1] < 50) params.set("priceMax", priceRange[1].toString());
    if (minContextSize > 0) params.set("contextMin", minContextSize.toString());
    if (selectedCapabilities.size > 0) {
      params.set(
        "capabilities",
        Array.from(selectedCapabilities).sort().join(",")
      );
    }
    if (showPtbOnly) params.set("ptb", "true");
    if (sortBy !== "newest") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    router.push(newUrl, { scroll: false });
  }, [
    searchQuery,
    selectedProviders,
    priceRange,
    minContextSize,
    selectedCapabilities,
    showPtbOnly,
    sortBy,
    router,
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

  return (
    <div className="h-screen bg-white dark:bg-black pt-20 lg:pt-0 flex overflow-hidden">
          {/* Left Sidebar - Filters */}
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <div className={`${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:relative w-[75vw] lg:w-80 lg:flex-shrink-0 transition-transform duration-300 z-50 lg:z-auto left-0 top-0 h-screen lg:h-full bg-white dark:bg-gray-900 lg:border-r border-gray-200 dark:border-gray-800 overflow-y-auto shadow-xl lg:shadow-none`}>
                <div className="p-6">
                  {/* Mobile close button */}
                  <div className="lg:hidden flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                {/* Provider Filter */}
                <FilterSection
                  title="Providers"
                  expanded={expandedSections.has("providers")}
                  onToggle={() => toggleSection("providers")}
                >
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {availableFilters.providers.map((provider) => {
                      const providerName =
                        typeof provider === "string" ? provider : provider.name;
                      const displayName =
                        typeof provider === "string"
                          ? provider
                          : provider.displayName;
                      const isSelected = selectedProviders.has(providerName);
                      return (
                        <FilterOption
                          key={providerName}
                          label={displayName}
                          selected={isSelected}
                          onToggle={() => {
                            const newSet = new Set(selectedProviders);
                            if (isSelected) {
                              newSet.delete(providerName);
                            } else {
                              newSet.add(providerName);
                            }
                            setSelectedProviders(newSet);
                          }}
                        />
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Price Range Filter */}
                <FilterSection
                  title="Price Range"
                  expanded={expandedSections.has("price")}
                  onToggle={() => toggleSection("price")}
                >
                  <SliderFilter
                    value={priceRange}
                    onChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={50}
                    step={0.1}
                    formatLabel={(value) => {
                      const [min, max] = value as [number, number];
                      return `$${min.toFixed(2)} - $${max.toFixed(2)} per M tokens`;
                    }}
                  />
                </FilterSection>

                {/* Context Size Filter */}
                <FilterSection
                  title="Context Size"
                  expanded={expandedSections.has("context")}
                  onToggle={() => toggleSection("context")}
                >
                  <SliderFilter
                    value={minContextSize}
                    onChange={(value) => setMinContextSize(value as number)}
                    min={0}
                    max={1000000}
                    step={1000}
                    label="Minimum"
                    formatLabel={(value) => {
                      const size = value as number;
                      return size >= 1000
                        ? `${(size / 1000).toFixed(0)}K tokens`
                        : `${size} tokens`;
                    }}
                  />
                </FilterSection>

                {/* Capabilities Filter */}
                <FilterSection
                  title="Special Capabilities"
                  expanded={expandedSections.has("capabilities")}
                  onToggle={() => toggleSection("capabilities")}
                >
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
                        <FilterOption
                          key={capability}
                          label={labelMap[capability] || capability}
                          selected={isSelected}
                          onToggle={() => {
                            const newSet = new Set(selectedCapabilities);
                            if (isSelected) {
                              newSet.delete(capability);
                            } else {
                              newSet.add(capability);
                            }
                            setSelectedCapabilities(newSet);
                          }}
                        />
                      );
                    })}
                  </div>
                </FilterSection>
                </div>
            </div>
          </>

          {/* Right Content - Table */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Controls Box */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="p-4 lg:p-6">
                <div className="flex flex-col gap-4">
                  {/* Title and model count */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Models
                      </h1>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {filteredModels.length} of {totalModels} models
                      </span>
                    </div>
                    {/* Reset filters button - always rendered to prevent layout shift */}
                    <button
                      onClick={() => {
                        setSelectedProviders(new Set());
                        setPriceRange([0, 50]);
                        setMinContextSize(0);
                        setSelectedCapabilities(new Set());
                        setShowPtbOnly(false);
                        setSearchQuery("");
                      }}
                      className={`px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all flex items-center gap-2 ${
                        isFiltered
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 pointer-events-none"
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reset filters
                    </button>
                  </div>

                  {/* Search bar and sort */}
                  <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search bar */}
                    <div className="relative lg:flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                      />
                    </div>

                    {/* Mobile filter button */}
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="lg:hidden flex items-center justify-center gap-2 px-4 h-10 border border-gray-200 dark:border-gray-800 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </button>

                    {/* PTB Toggle */}
                    <TooltipProvider>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor="ptb-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            Credits
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Only show models that can be used with Helicone Credits. Add credits to your account to access these models without needing individual provider API keys.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          id="ptb-toggle"
                          checked={showPtbOnly}
                          onCheckedChange={setShowPtbOnly}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </TooltipProvider>

                    {/* Sort dropdown */}
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as SortOption)}
                    >
                      <SelectTrigger className="w-full lg:w-[160px] h-10">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price-low">
                          Price: Low to High
                        </SelectItem>
                        <SelectItem value="price-high">
                          Price: High to Low
                        </SelectItem>
                        <SelectItem value="context">Context Size</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Models Table */}
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full">
                  {filteredModels.map((model, index) => {
                    const minInputCost = Math.min(
                      ...model.endpoints.map((e) => e.pricing.prompt)
                    );
                    const minOutputCost = Math.min(
                      ...model.endpoints.map((e) => e.pricing.completion)
                    );
                    const isFree = minInputCost === 0;

                    return (
                      <tbody key={model.id} className="group">
                        <tr
                          className="border-t-4 border-transparent cursor-pointer group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50"
                          onClick={(e) => {
                            if (!(e.target as HTMLElement).closest("button")) {
                              const currentParams = searchParams.toString();
                              router.push(
                                `/model/${encodeURIComponent(model.id)}${currentParams ? `?${currentParams}` : ""}`
                              );
                            }
                          }}
                        >
                          <td className="px-4 lg:px-6 pt-6 pb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-normal text-gray-900 dark:text-gray-100">
                                {model.name.replace(
                                  new RegExp(`^${model.author}:\s*`, "i"),
                                  ""
                                )}
                              </span>
                              <CopyButton
                                textToCopy={model.id}
                                tooltipContent={`Copy: ${model.id}`}
                                iconSize={14}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              />
                              {isFree && (
                                <span className="text-xs font-normal text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-2 py-0.5">
                                  Free
                                </span>
                              )}
                              {model.endpoints.some(ep => ep.supportsPtb) && (
                                <span className="text-xs font-normal text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5">
                                  Credits
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        <tr
                          className="cursor-pointer group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50"
                          onClick={(e) => {
                            if (!(e.target as HTMLElement).closest("button")) {
                              const currentParams = searchParams.toString();
                              router.push(
                                `/model/${encodeURIComponent(model.id)}${currentParams ? `?${currentParams}` : ""}`
                              );
                            }
                          }}
                        >
                          <td className="px-4 lg:px-6 pt-1 pb-6">
                            <div className="space-y-2">
                              {model.description && (
                                <div className="text-base font-light text-gray-400 dark:text-gray-500">
                                  {model.description.length > 150
                                    ? `${model.description.slice(0, 150)}...`
                                    : model.description}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm font-light text-gray-400 dark:text-gray-500">
                                <div>by {model.author}</div>
                                <div className="hidden sm:block">•</div>
                                <div>
                                  {formatContext(model.contextLength)} context
                                </div>
                                <div className="hidden sm:block">•</div>
                                <div className="flex flex-wrap gap-1">
                                  <span>
                                    ${minInputCost < 1
                                      ? minInputCost.toFixed(2)
                                      : minInputCost.toFixed(1)}/M in
                                  </span>
                                  <span className="hidden sm:inline">,</span>
                                  <span>
                                    ${minOutputCost < 1
                                      ? minOutputCost.toFixed(2)
                                      : minOutputCost.toFixed(1)}/M out
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {index < filteredModels.length - 1 && (
                          <tr>
                            <td className="px-6 py-2">
                              <div className="border-b border-gray-100 dark:border-gray-800/50 mx-12"></div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
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
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
    </div>
  );
}
