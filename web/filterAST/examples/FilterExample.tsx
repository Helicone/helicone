import React, { useEffect } from "react";
import { useUrlSyncedFilterStore } from "../hooks/useFilterWithUrl";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { H3, P } from "@/components/ui/typography";
import { FilterExpression } from "../filterAst";

/**
 * Example component demonstrating how to use the useUrlSyncedFilterStore hook
 */
export const FilterExample: React.FC = () => {
  const filterStore = useUrlSyncedFilterStore();
  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  // Fetch saved filters on mount
  useEffect(() => {
    if (orgId) {
      filterStore.fetchSavedFilters(orgId);
    }
  }, [orgId, filterStore]);

  // Create a simple filter
  const createSimpleFilter = () => {
    const simpleFilter: FilterExpression = {
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

    filterStore.setActiveFilter({
      name: "Simple Filter",
      filter: simpleFilter,
    });
  };

  // Save the current filter
  const saveCurrentFilter = async () => {
    if (!orgId || !filterStore.activeFilter?.filter) return;

    try {
      await filterStore.saveFilter(
        orgId,
        "My Saved Filter",
        filterStore.activeFilter.filter
      );
      alert("Filter saved successfully!");
    } catch (error) {
      console.error("Error saving filter:", error);
      alert("Failed to save filter");
    }
  };

  // Clear the current filter
  const clearFilter = () => {
    filterStore.clearActiveFilter();
  };

  // Get a shareable URL for the current filter
  const getShareableUrl = () => {
    const url = filterStore.getShareableUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      alert("Shareable URL copied to clipboard!");
    } else {
      alert("No filter to share. Save your filter first.");
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      <H3>Filter Store Example</H3>

      <div className="space-y-2">
        <P>Current Filter:</P>
        <pre className="bg-muted p-4 rounded-md overflow-auto max-h-40">
          {JSON.stringify(filterStore.activeFilter, null, 2) ||
            "No active filter"}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={createSimpleFilter}>Create Simple Filter</Button>
        <Button
          onClick={saveCurrentFilter}
          disabled={!filterStore.activeFilter?.filter || !orgId}
        >
          Save Filter
        </Button>
        <Button
          onClick={clearFilter}
          disabled={!filterStore.activeFilter}
          variant="outline"
        >
          Clear Filter
        </Button>
        <Button
          onClick={getShareableUrl}
          disabled={!filterStore.activeFilter?.id}
          variant="outline"
        >
          Copy Shareable URL
        </Button>
      </div>

      <div className="space-y-2">
        <P>Saved Filters ({filterStore.savedFilters.length}):</P>
        <div className="space-y-2">
          {filterStore.isLoadingSavedFilters ? (
            <P>Loading saved filters...</P>
          ) : filterStore.savedFilters.length === 0 ? (
            <P className="text-muted-foreground">No saved filters</P>
          ) : (
            filterStore.savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="p-3 border rounded-md cursor-pointer hover:bg-accent"
                onClick={() =>
                  filter.id && filterStore.loadFilterById(filter.id)
                }
              >
                <P className="font-medium">{filter.name}</P>
                <P className="text-sm text-muted-foreground">
                  {filter.createdAt
                    ? new Date(filter.createdAt).toLocaleDateString()
                    : "Unknown date"}
                </P>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterExample;
