import { useMemo, useCallback } from "react";
import {
  Model,
  FilterOptions,
  SortOption,
  applyFilters,
  sortModels,
  extractAvailableFilters,
} from "../lib/filters/modelFilters";

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
  // Extract available filters from all models
  const availableFilters = useMemo(
    () => extractAvailableFilters(models),
    [models],
  );

  // Check if any filters are applied
  const isFiltered = useMemo(() => {
    return !!(
      search ||
      selectedProviders.size > 0 ||
      priceRange[0] > 0 ||
      priceRange[1] < 50 ||
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
    const filterOptions: FilterOptions = {
      search,
      providers: selectedProviders,
      priceRange,
      minContextSize,
      capabilities: selectedCapabilities,
      showPtbOnly,
      authors: selectedAuthors,
      inputModalities: selectedInputModalities as any,
      outputModalities: selectedOutputModalities as any,
      parameters: selectedParameters as any,
    };

    // Apply all filters
    const filtered = applyFilters(models, filterOptions);

    // Apply sorting
    return sortModels(filtered, sortBy);
  }, [
    models,
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
    return new Set(param?.split(",").filter(Boolean) || []);
  }, []);

  const getNumberFromParam = useCallback(
    (param: string | null, defaultValue: number): number => {
      const value = Number(param);
      return isNaN(value) ? defaultValue : value;
    },
    [],
  );

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
