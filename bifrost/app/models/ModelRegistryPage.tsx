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
  Plus,
  GitCompare,
} from "lucide-react";
import { RequestModelModal } from "./RequestModelModal";
import { Button } from "@/components/ui/button";
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
import {
  INPUT_MODALITIES,
  OUTPUT_MODALITIES,
  MODALITY_LABELS,
} from "@/lib/constants/modalities";
import Link from "next/link";

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
    Number(searchParams.get("priceMax") || 200),
  ]);
  const [minContextSize, setMinContextSize] = useState<number>(
    Number(searchParams.get("contextMin") || 0)
  );
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(
    new Set(searchParams.get("capabilities")?.split(",").filter(Boolean) || [])
  );
  const [selectedInputModalities, setSelectedInputModalities] = useState<
    Set<string>
  >(
    new Set(
      searchParams.get("inputModalities")?.split(",").filter(Boolean) || []
    )
  );
  const [selectedOutputModalities, setSelectedOutputModalities] = useState<
    Set<string>
  >(
    new Set(
      searchParams.get("outputModalities")?.split(",").filter(Boolean) || []
    )
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
      selectedInputModalities,
      selectedOutputModalities,
      showPtbOnly,
      sortBy,
    });

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([
      "providers",
      "price",
      "context",
      "capabilities",
      "inputModalities",
      "outputModalities",
    ])
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

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
          // Cast to Model[] - the API types have slight differences but runtime data is compatible
          setAllModels(data.models as unknown as Model[]);
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
    // Only run on client side
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (selectedProviders.size > 0) {
      params.set("providers", Array.from(selectedProviders).sort().join(","));
    }
    if (priceRange[0] > 0) params.set("priceMin", priceRange[0].toString());
    if (priceRange[1] < 200) params.set("priceMax", priceRange[1].toString());
    if (minContextSize > 0) params.set("contextMin", minContextSize.toString());
    if (selectedCapabilities.size > 0) {
      params.set(
        "capabilities",
        Array.from(selectedCapabilities).sort().join(",")
      );
    }
    if (selectedInputModalities.size > 0) {
      params.set(
        "inputModalities",
        Array.from(selectedInputModalities).sort().join(",")
      );
    }
    if (selectedOutputModalities.size > 0) {
      params.set(
        "outputModalities",
        Array.from(selectedOutputModalities).sort().join(",")
      );
    }
    if (showPtbOnly) params.set("ptb", "true");
    if (sortBy !== "newest") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/models?${params.toString()}`
      : "/models";

    router.push(newUrl, { scroll: false });
  }, [
    searchQuery,
    selectedProviders,
    priceRange,
    minContextSize,
    selectedCapabilities,
    selectedInputModalities,
    selectedOutputModalities,
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
    <div className="bg-white dark:bg-black pt-16 lg:pt-0 flex flex-col lg:flex-row">
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
        <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 fixed lg:sticky lg:top-16 w-[75vw] lg:w-80 lg:flex-shrink-0 transition-transform duration-300 z-50 lg:z-10 left-0 top-0 h-screen lg:h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 lg:border-r border-gray-200 dark:border-gray-800 overflow-y-auto shadow-xl lg:shadow-none lg:self-start`}
        >
          <div className="p-6">
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Filters
              </h2>
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
                max={200}
                formatLabel={(value) => {
                  const [min, max] = value as [number, number];
                  const formatPrice = (v: number) =>
                    v < 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(0)}`;
                  return `${formatPrice(min)} - ${formatPrice(max)}/M tokens`;
                }}
                formatValue={(value) => {
                  if (value < 1) return `$${value.toFixed(2)}`;
                  return `$${value.toFixed(0)}`;
                }}
                showTicks
                weighted
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
                  if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M tokens`;
                  if (size >= 1000) return `${(size / 1000).toFixed(0)}K tokens`;
                  return `${size} tokens`;
                }}
                formatValue={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return `${value}`;
                }}
                showTicks
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

            {/* Input Modalities Filter */}
            <FilterSection
              title="Input Modalities"
              expanded={expandedSections.has("inputModalities")}
              onToggle={() => toggleSection("inputModalities")}
            >
              <div className="space-y-1">
                {INPUT_MODALITIES.map((modality) => {
                  const isSelected = selectedInputModalities.has(modality);

                  return (
                    <FilterOption
                      key={modality}
                      label={MODALITY_LABELS[modality]}
                      selected={isSelected}
                      onToggle={() => {
                        const newSet = new Set(selectedInputModalities);
                        if (isSelected) {
                          newSet.delete(modality);
                        } else {
                          newSet.add(modality);
                        }
                        setSelectedInputModalities(newSet);
                      }}
                    />
                  );
                })}
              </div>
            </FilterSection>

            {/* Output Modalities Filter */}
            <FilterSection
              title="Output Modalities"
              expanded={expandedSections.has("outputModalities")}
              onToggle={() => toggleSection("outputModalities")}
            >
              <div className="space-y-1">
                {OUTPUT_MODALITIES.map((modality) => {
                  const isSelected = selectedOutputModalities.has(modality);

                  return (
                    <FilterOption
                      key={modality}
                      label={MODALITY_LABELS[modality]}
                      selected={isSelected}
                      onToggle={() => {
                        const newSet = new Set(selectedOutputModalities);
                        if (isSelected) {
                          newSet.delete(modality);
                        } else {
                          newSet.add(modality);
                        }
                        setSelectedOutputModalities(newSet);
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
      <div className="flex-1 min-w-0">
        {/* Controls Box */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[58px] z-10">
          <div className="p-4 lg:p-6">
            <div className="flex flex-col gap-4">
              {/* Search bar and sort */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search bar */}
                <div className="relative lg:flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-transparent border-input"
                  />
                </div>

                {/* Mobile filter button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex items-center justify-center gap-2 px-3 h-9 border border-input rounded-md text-sm text-foreground bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Filter className="h-4 w-4 opacity-50" />
                  <span>Filters</span>
                </button>

                {/* PTB Toggle */}
                <TooltipProvider>
                  <div className="flex items-center gap-2 px-3 h-9 border border-input rounded-md bg-transparent shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <label
                        htmlFor="ptb-toggle"
                        className="text-sm text-foreground whitespace-nowrap"
                      >
                        Credits
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Only show models that can be used with Helicone
                            Credits. Add credits to your account to access these
                            models without needing individual provider API keys.
                          </p>
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
                  <SelectTrigger className="w-full lg:w-[160px]">
                    <ArrowUpDown className="h-4 w-4 mr-2 opacity-50" />
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

                {/* Request Model Button */}
                <button
                  onClick={() => setRequestModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 h-9 border border-input rounded-md text-sm text-foreground bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 opacity-50" />
                  <span className="hidden sm:inline">Request Model</span>
                </button>
                {/* Compare button */}
                <Link href="/comparison">
                  <Button variant="outline" size="sm" className="gap-2 h-10">
                    <GitCompare className="h-4 w-4" />
                    Compare
                  </Button>
                </Link>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredModels.length} of {totalModels} models
                </span>
                <div className="flex justify-between items-center">
                  {/* Reset filters button - always rendered to prevent layout shift */}
                  <button
                    onClick={() => {
                      setSelectedProviders(new Set());
                      setPriceRange([0, 200]);
                      setMinContextSize(0);
                      setSelectedCapabilities(new Set());
                      setSelectedInputModalities(new Set());
                      setSelectedOutputModalities(new Set());
                      setShowPtbOnly(false);
                      setSearchQuery("");
                    }}
                    className={`px-3 text-sm text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 ${isFiltered
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                      }`}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div className="bg-white dark:bg-gray-900">
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

                const currentParams = searchParams.toString();
                const modelUrl = `/model/${encodeURIComponent(model.id)}${currentParams ? `?${currentParams}` : ""}`;

                return (
                  <tbody key={model.id} className="group relative">
                    {/* Invisible link overlay for proper link behavior */}
                    <Link
                      href={modelUrl}
                      className="absolute inset-0 pointer-events-auto"
                      aria-label={`View ${model.name}`}
                    />
                    <tr className="border-t-4 border-transparent cursor-pointer group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 pointer-events-none">
                      <td className="px-4 lg:px-6 pt-6 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-normal text-gray-900 dark:text-gray-100">
                            {model.name.replace(
                              new RegExp(`^${model.author}:\\s*`, "i"),
                              ""
                            )}
                          </span>
                          <CopyButton
                            textToCopy={model.id}
                            tooltipContent={`Copy: ${model.id}`}
                            iconSize={14}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 pointer-events-auto"
                          />
                          {model.pinnedVersionOfModel && (
                            <span className="text-xs font-normal text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5">
                              Pinned Version
                            </span>
                          )}
                          {isFree && (
                            <span className="text-xs font-normal text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-2 py-0.5">
                              Free
                            </span>
                          )}
                          {model.endpoints.some((ep) => ep.supportsPtb) && (
                            <span className="text-xs font-normal text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5">
                              Credits
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="pointer-events-none">
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
                                $
                                {minInputCost < 1
                                  ? minInputCost.toFixed(2)
                                  : minInputCost.toFixed(1)}
                                /M in
                              </span>
                              <span className="hidden sm:inline">,</span>
                              <span>
                                $
                                {minOutputCost < 1
                                  ? minOutputCost.toFixed(2)
                                  : minOutputCost.toFixed(1)}
                                /M out
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

      {/* Request Model Modal */}
      <RequestModelModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
      />
    </div>
  );
}
