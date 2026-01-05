import { useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import {
  Model,
  FilterOptions,
  SortOption,
  applyFilters,
  sortModels,
  extractAvailableFilters,
} from '../lib/filters/modelFilters';
import { StandardParameter } from '@helicone-package/cost/models/types';

interface UseModelFilteringProps {
  models: Model[];
  search: string;
  selectedProviders: Set<string>;
  priceRange: [number, number];
  minContextSize: number;
  selectedCapabilities: Set<string>;
  sortBy: SortOption;
  showPtbOnly?: boolean;
  selectedAuthors?: Set<string>;
  selectedInputModalities?: Set<string>;
  selectedOutputModalities?: Set<string>;
  selectedParameters?: Set<string>;
}

interface UseModelFilteringResult {
  filteredModels: Model[];
  totalModels: number;
  availableFilters: {
    providers: Array<{ name: string; displayName: string }>;
    authors: string[];
    capabilities: string[];
  };
  isFiltered: boolean;
}

export function useModelFiltering({
  models,
  search,
  selectedProviders,
  priceRange,
  minContextSize,
  selectedCapabilities,
  sortBy,
  showPtbOnly = false,
  selectedAuthors,
  selectedInputModalities,
  selectedOutputModalities,
  selectedParameters,
}: UseModelFilteringProps): UseModelFilteringResult {
  // Create a memoized Fuse instance for optimal search performance
  // Only recreated when the models array changes
  const fuse = useMemo(
    () => new Fuse(models, {
      keys: [
        { name: 'name', weight: 2 },        // Higher weight for name matches
        { name: 'id', weight: 1.5 },        // Medium weight for ID matches
        { name: 'author', weight: 1 },      // Standard weight for author
        { name: 'description', weight: 0.5 } // Lower weight for description
      ],
      threshold: 0.3,                        // 0 = perfect match, 1 = match anything
      includeScore: true,                    // Include relevance score
      minMatchCharLength: 2,                 // Require at least 2 characters to match
      ignoreLocation: true,                  // Search anywhere in the string
    }),
    [models]
  );

  // Extract available filters from all models
  const availableFilters = useMemo(
    () => extractAvailableFilters(models),
    [models]
  );

  // Check if any filters are applied
  const isFiltered = useMemo(() => {
    return !!(
      search ||
      selectedProviders.size > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < 200 ||
      minContextSize > 0 ||
      selectedCapabilities.size > 0 ||
      showPtbOnly ||
      (selectedAuthors && selectedAuthors.size > 0) ||
      (selectedInputModalities && selectedInputModalities.size > 0) ||
      (selectedOutputModalities && selectedOutputModalities.size > 0) ||
      (selectedParameters && selectedParameters.size > 0)
    );
  }, [
    search,
    selectedProviders,
    priceRange,
    minContextSize,
    selectedCapabilities,
    showPtbOnly,
    selectedAuthors,
    selectedInputModalities,
    selectedOutputModalities,
    selectedParameters,
  ]);

  // Apply filters and sorting
  const filteredModels = useMemo(() => {
    // First, apply fuzzy search using the memoized Fuse instance
    let searchFiltered = models;
    if (search) {
      const results = fuse.search(search);
      searchFiltered = results.map(result => result.item);
    }

    // Then apply other filters to the search results
    const filterOptions: FilterOptions = {
      // Don't pass search to applyFilters since we handled it above
      providers: selectedProviders,
      priceRange,
      minContextSize,
      capabilities: selectedCapabilities,
      showPtbOnly,
      authors: selectedAuthors,
      inputModalities: selectedInputModalities as Set<"text" | "image" | "audio" | "video"> | undefined,
      outputModalities: selectedOutputModalities as Set<"text" | "image" | "audio" | "video"> | undefined,
      parameters: selectedParameters as Set<StandardParameter> | undefined,
    };

    // Apply all other filters to the search-filtered results
    const filtered = applyFilters(searchFiltered, filterOptions);

    // Apply sorting
    return sortModels(filtered, sortBy);
  }, [
    models,
    search,
    fuse,
    selectedProviders,
    priceRange,
    minContextSize,
    selectedCapabilities,
    showPtbOnly,
    selectedAuthors,
    selectedInputModalities,
    selectedOutputModalities,
    selectedParameters,
    sortBy,
  ]);

  return {
    filteredModels,
    totalModels: models.length,
    availableFilters,
    isFiltered,
  };
}

// Hook for managing filter state
export function useModelFilterState(searchParams: URLSearchParams) {
  const getSetFromParam = useCallback((param: string | null): Set<string> => {
    return new Set(param?.split(',').filter(Boolean) || []);
  }, []);

  const getNumberFromParam = useCallback((param: string | null, defaultValue: number): number => {
    const value = Number(param);
    return isNaN(value) ? defaultValue : value;
  }, []);

  return {
    search: searchParams.get("search") || "",
    selectedProviders: getSetFromParam(searchParams.get("providers")),
    priceRange: [
      getNumberFromParam(searchParams.get("priceMin"), 0),
      getNumberFromParam(searchParams.get("priceMax"), 50),
    ] as [number, number],
    minContextSize: getNumberFromParam(searchParams.get("contextMin"), 0),
    selectedCapabilities: getSetFromParam(searchParams.get("capabilities")),
    sortBy: (searchParams.get("sort") as SortOption) || "newest",
  };
}