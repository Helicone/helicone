import { useState } from "react";
import { useFilterStore } from "../store/filterStore";
import { AndExpression, ConditionExpression } from "../filterAst";
import { StoreFilterType } from "../hooks/useFilterCrud";

/**
 * Custom hook for common filter actions
 * Provides utility functions for adding, removing, and managing filters
 */
export const useFilterActions = () => {
  const filterStore = useFilterStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Create an empty default filter
  const DEFAULT_FILTER: AndExpression = {
    type: "and",
    expressions: [
      {
        type: "condition",
        field: {
          column: "status",
        },
        operator: "eq",
        value: "",
      },
    ],
  };

  /**
   * Check if there are any active filters
   */
  const hasActiveFilters = (): boolean => {
    return (
      !!filterStore.filter &&
      (filterStore.filter.type === "and" || filterStore.filter.type === "or") &&
      filterStore.filter.expressions.length > 0
    );
  };

  /**
   * Create a simple example filter
   * Useful for testing or providing a starting point
   */
  const createSimpleFilter = () => {
    const simpleFilter: AndExpression = {
      type: "and",
      expressions: [
        {
          type: "condition",
          field: { column: "status" },
          operator: "eq",
          value: 200,
        },
      ],
    };

    filterStore.setFilter(simpleFilter);
    return simpleFilter;
  };

  /**
   * Clear the current filter
   */
  const clearFilter = () => {
    filterStore.setFilter(DEFAULT_FILTER);
    filterStore.setActiveFilterName("Untitled Filter");
  };

  /**
   * Add a timestamp condition to the current filter
   * Useful for common filtering patterns
   */
  const addTimestampCondition = (days: number = 7) => {
    if (!filterStore.filter) return;

    // Calculate date from N days ago
    const date = new Date();
    date.setDate(date.getDate() - days);
    const isoDate = date.toISOString();

    const timeCondition: ConditionExpression = {
      type: "condition",
      field: { column: "response_created_at" },
      operator: "gt",
      value: isoDate,
    };

    filterStore.addFilterExpression([], timeCondition);
  };

  /**
   * Get a human-readable description of the current filter
   */
  const getFilterDescription = (): string => {
    if (!filterStore.filter) return "No filter applied";

    if (
      (filterStore.filter.type === "and" || filterStore.filter.type === "or") &&
      filterStore.filter.expressions.length === 0
    ) {
      return "Empty filter";
    }

    if (filterStore.filter.type === "and" || filterStore.filter.type === "or") {
      const conditionCount = filterStore.filter.expressions.length;
      const operator = filterStore.filter.type.toUpperCase();
      return `${conditionCount} conditions with ${operator} logic`;
    }

    return "Simple condition";
  };

  /**
   * Update the filter name
   * @param name - The new name for the filter
   */
  const updateFilterName = (name: string) => {
    filterStore.setActiveFilterName(name);
    // Mark filter as having unsaved changes when name is updated
    if (filterStore.activeFilterId) {
      filterStore.setHasUnsavedChanges(true);
    }
  };

  return {
    saveDialogOpen,
    setSaveDialogOpen,
    updateFilterName,
    hasActiveFilters,
    createSimpleFilter,
    clearFilter,
    addTimestampCondition,
    getFilterDescription,
  };
};

export default useFilterActions;
