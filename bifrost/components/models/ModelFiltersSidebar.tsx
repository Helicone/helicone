"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FilterSection } from "@/components/ui/filters/FilterSection";
import { FilterOption } from "@/components/ui/filters/FilterOption";
import { SliderFilter } from "@/components/ui/filters/SliderFilter";
import {
  INPUT_MODALITIES,
  OUTPUT_MODALITIES,
  MODALITY_LABELS,
} from "@/lib/constants/modalities";

export interface FilterState {
  selectedProviders: Set<string>;
  priceRange: [number, number];
  minContextSize: number;
  selectedCapabilities: Set<string>;
  selectedInputModalities: Set<string>;
  selectedOutputModalities: Set<string>;
  showPtbOnly: boolean;
}

export interface AvailableFilters {
  providers: Array<string | { name: string; displayName: string }>;
  capabilities: string[];
}

interface ModelFiltersSidebarProps {
  // For interactive mode (registry page)
  filterState?: FilterState;
  onFilterChange?: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  availableFilters?: AvailableFilters;

  // For navigation mode (model detail page)
  navigationMode?: boolean;
  currentProviders?: string[]; // Providers to highlight as "current model's providers"

  // Mobile controls
  sidebarOpen: boolean;
  onSidebarClose: () => void;
}

const CAPABILITY_LABELS: Record<string, string> = {
  audio: "Audio Processing",
  video: "Video Processing",
  thinking: "Chain-of-Thought",
  web_search: "Web Search",
  image: "Image Processing",
  caching: "Caching",
  reasoning: "Reasoning",
};

export function ModelFiltersSidebar({
  filterState,
  onFilterChange,
  availableFilters,
  navigationMode = false,
  currentProviders = [],
  sidebarOpen,
  onSidebarClose,
}: ModelFiltersSidebarProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["providers", "price", "context", "capabilities", "inputModalities", "outputModalities"])
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

  const handleProviderClick = (providerName: string) => {
    if (navigationMode) {
      // Navigate to models page with this provider selected
      router.push(`/models?providers=${encodeURIComponent(providerName)}`);
    } else if (onFilterChange && filterState) {
      const newSet = new Set(filterState.selectedProviders);
      if (newSet.has(providerName)) {
        newSet.delete(providerName);
      } else {
        newSet.add(providerName);
      }
      onFilterChange("selectedProviders", newSet);
    }
  };

  // Default available filters for navigation mode
  const providers = availableFilters?.providers || [];
  const capabilities = availableFilters?.capabilities || [];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onSidebarClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:sticky lg:top-16 w-[75vw] lg:w-80 lg:flex-shrink-0 transition-transform duration-300 z-50 lg:z-10 left-0 top-0 h-screen lg:h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 lg:border-r border-gray-200 dark:border-gray-800 overflow-y-auto shadow-xl lg:shadow-none lg:self-start`}
      >
        <div className="p-6">
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {navigationMode ? "Browse by Provider" : "Filters"}
            </h2>
            <button
              onClick={onSidebarClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Provider Filter */}
          <FilterSection
            title={navigationMode ? "Browse by Provider" : "Providers"}
            expanded={expandedSections.has("providers")}
            onToggle={() => toggleSection("providers")}
          >
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
              {providers.map((provider) => {
                const providerName = typeof provider === "string" ? provider : provider.name;
                const displayName = typeof provider === "string" ? provider : provider.displayName;
                const isSelected = navigationMode
                  ? currentProviders.includes(providerName)
                  : filterState?.selectedProviders.has(providerName) || false;

                return (
                  <FilterOption
                    key={providerName}
                    label={displayName}
                    selected={isSelected}
                    onToggle={() => handleProviderClick(providerName)}
                  />
                );
              })}
            </div>
          </FilterSection>

          {/* Only show other filters in interactive mode */}
          {!navigationMode && filterState && onFilterChange && (
            <>
              {/* Price Range Filter */}
              <FilterSection
                title="Price Range"
                expanded={expandedSections.has("price")}
                onToggle={() => toggleSection("price")}
              >
                <SliderFilter
                  value={filterState.priceRange}
                  onChange={(value) => onFilterChange("priceRange", value as [number, number])}
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
                  value={filterState.minContextSize}
                  onChange={(value) => onFilterChange("minContextSize", value as number)}
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
                  {capabilities.map((capability) => {
                    const isSelected = filterState.selectedCapabilities.has(capability);
                    return (
                      <FilterOption
                        key={capability}
                        label={CAPABILITY_LABELS[capability] || capability}
                        selected={isSelected}
                        onToggle={() => {
                          const newSet = new Set(filterState.selectedCapabilities);
                          if (isSelected) {
                            newSet.delete(capability);
                          } else {
                            newSet.add(capability);
                          }
                          onFilterChange("selectedCapabilities", newSet);
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
                    const isSelected = filterState.selectedInputModalities.has(modality);
                    return (
                      <FilterOption
                        key={modality}
                        label={MODALITY_LABELS[modality]}
                        selected={isSelected}
                        onToggle={() => {
                          const newSet = new Set(filterState.selectedInputModalities);
                          if (isSelected) {
                            newSet.delete(modality);
                          } else {
                            newSet.add(modality);
                          }
                          onFilterChange("selectedInputModalities", newSet);
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
                    const isSelected = filterState.selectedOutputModalities.has(modality);
                    return (
                      <FilterOption
                        key={modality}
                        label={MODALITY_LABELS[modality]}
                        selected={isSelected}
                        onToggle={() => {
                          const newSet = new Set(filterState.selectedOutputModalities);
                          if (isSelected) {
                            newSet.delete(modality);
                          } else {
                            newSet.add(modality);
                          }
                          onFilterChange("selectedOutputModalities", newSet);
                        }}
                      />
                    );
                  })}
                </div>
              </FilterSection>
            </>
          )}
        </div>
      </div>
    </>
  );
}
