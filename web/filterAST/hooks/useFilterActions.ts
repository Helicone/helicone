import { useState } from "react";
import { useFilterStore } from "../store/filterStore";
import { AndExpression, ConditionExpression } from "../filterAst";

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
    expressions: [],
  };

  /**
   * Initialize a new empty filter if none exists
   */
  const initializeFilter = () => {
    if (!filterStore.filter) {
      filterStore.setFilter(DEFAULT_FILTER);
    }
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

  return {
    saveDialogOpen,
    setSaveDialogOpen,
    initializeFilter,
    hasActiveFilters,
    createSimpleFilter,
    clearFilter,
    addTimestampCondition,
    getFilterDescription,
  };
};

export default useFilterActions;
