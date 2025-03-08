import React, { useState, useEffect } from "react";
import { FilterPillDropdown } from "@/components/shared/themed/filterAST";
import {
  toSqlWhereClause,
  FilterExpression,
} from "@/services/lib/filters/filterAst";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedFilterStore } from "@/store/filterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SaveIcon,
  TrashIcon,
  ClockIcon,
  RefreshCwIcon,
  FileTextIcon,
  DatabaseIcon,
} from "lucide-react";

// Define the SavedFilter interface based on the store
interface SavedFilter {
  id: string;
  organization_id: string;
  name?: string;
  filter: any;
  created_at: string;
  last_used: string;
  created_by?: string;
  is_global: boolean;
}

export default function TestFilterPage() {
  // Use the filter store instead of local state
  const {
    filter,
    setFilter,
    resetFilter,
    setPropertyFilter,
    setScoreFilter,
    savedFilters,
    savedFilter,
    saveFilter,
    deleteFilter,
    markAsUsed,
    filterId,
    setFilterId,
    isFetchingFilters,
    isFetchingFilter,
    isSaving,
    isDeleting,
  } = useSavedFilterStore();

  // State to track if we're creating a new filter
  const [isCreatingFilter, setIsCreatingFilter] = useState(false);

  // For displaying the filter in different formats
  const [activeTab, setActiveTab] = useState<string>("json");

  // For saving filters
  const [filterName, setFilterName] = useState<string>("");
  const [isGlobal, setIsGlobal] = useState<boolean>(false);

  // Initialize or clear the filter when the component mounts or filterId changes
  useEffect(() => {
    if (filterId) {
      // If we have a filterId but no filter data yet, the filter will be loaded by the store
      console.log(
        `Filter ID detected in URL: ${filterId}, waiting for filter data to load`
      );
      // We don't need to do anything here as the filter will be set automatically by the store
    } else {
      // If we don't have a filterId, reset to empty filter
      console.log("No filter ID detected, resetting to empty filter");
      setFilter({ type: "and", expressions: [] });
    }
  }, [filterId, setFilter]);

  // Add an effect to log when the filter changes
  useEffect(() => {
    console.log("Filter changed:", filter);
  }, [filter]);

  // Also log when the saved filter changes
  useEffect(() => {
    if (savedFilter) {
      console.log("Saved filter loaded:", savedFilter);
    }
  }, [savedFilter]);

  // Handle saving a filter
  const handleSaveFilter = () => {
    saveFilter(filterName || undefined, isGlobal);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Create a filter using the Zustand store's saveFilter function
  // The saveFilter function just calls mutation.mutate() which doesn't return a value
  // The actual ID is handled by the onSuccess callback in the mutation
  const createNewFilter = async () => {
    const timestamp = Date.now();
    console.log(
      `[TNF-${timestamp}] createNewFilter called from test-filter.tsx`
    );
    setIsCreatingFilter(true);

    try {
      // Create a default filter with a simple condition
      const defaultFilter: FilterExpression = {
        type: "condition" as const,
        field: {
          column: "response_id",
        },
        operator: "eq",
        value: "",
      };

      console.log(
        `[TNF-${timestamp}] Setting initial filter state:`,
        defaultFilter
      );
      // Set the filter first so the UI updates immediately
      setFilter(defaultFilter);

      // Create a unique name with timestamp to avoid name conflicts
      const uniqueName = `Filter ${timestamp}`;

      console.log(`[TNF-${timestamp}] Saving filter with name:`, uniqueName);
      console.log(`[TNF-${timestamp}] Current filterId:`, filterId);

      try {
        // Call saveFilter - this triggers the mutation but doesn't directly return the created filter
        // The filter ID is set by the onSuccess callback in the mutation
        console.log(`[TNF-${timestamp}] Calling saveFilter`);
        await saveFilter(uniqueName, false);
        console.log(`[TNF-${timestamp}] saveFilter completed`);
      } catch (error) {
        console.error(`[TNF-${timestamp}] Error in saveFilter:`, error);
        throw error;
      }

      console.log(`[TNF-${timestamp}] Save filter operation initiated`);
      console.log(`[TNF-${timestamp}] Current filterId after save:`, filterId);

      // Manually force update if needed by directly checking the filter state
      setTimeout(() => {
        console.log(`[TNF-${timestamp}] Timeout check - filter state:`, {
          filter,
          filterId,
          isCreatingFilter,
        });

        if (!filterId) {
          console.warn(
            `[TNF-${timestamp}] Filter ID still not set after save operation`
          );
        } else {
          console.log(
            `[TNF-${timestamp}] Filter ID successfully set:`,
            filterId
          );
        }
      }, 1000);

      // Add another timeout check to see if things settle
      setTimeout(() => {
        console.log(`[TNF-${timestamp}] Second timeout check - filter state:`, {
          filter,
          filterId,
          isCreatingFilter,
        });
      }, 2000);
    } catch (error) {
      console.error(`[TNF-${timestamp}] Failed to create filter:`, error);
      // Reset filter if saving fails
      setFilter({ type: "and", expressions: [] });
    } finally {
      console.log(`[TNF-${timestamp}] Setting isCreatingFilter to false`);
      setIsCreatingFilter(false);
    }
  };

  // Get the filters array safely
  const filtersArray = Array.isArray(savedFilters)
    ? savedFilters
    : savedFilters && "data" in savedFilters && Array.isArray(savedFilters.data)
    ? savedFilters.data
    : [];

  // Get the current filter safely
  const currentSavedFilter =
    savedFilter &&
    typeof savedFilter === "object" &&
    "data" in savedFilter &&
    savedFilter.data
      ? savedFilter.data
      : null;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Filter AST Editor Test</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Filter editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Editor</CardTitle>
              <CardDescription>
                Create and edit filters using the pill dropdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilterPillDropdown
                filter={filterId ? filter : undefined}
                onChange={(newFilter) => setFilter(newFilter)}
                className="mb-4"
                createNewFilter={createNewFilter}
                isCreatingFilter={isCreatingFilter}
              />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={resetFilter}>
                <RefreshCwIcon className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={setPropertyFilter}>
                <DatabaseIcon className="h-4 w-4 mr-1" />
                Property Filter Example
              </Button>
              <Button variant="outline" size="sm" onClick={setScoreFilter}>
                <FileTextIcon className="h-4 w-4 mr-1" />
                Score Filter Example
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filter Output</CardTitle>
              <CardDescription>
                View the filter in different formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="sql">SQL</TabsTrigger>
                </TabsList>
                <TabsContent value="json">
                  <Code className="w-full h-64 overflow-auto p-4">
                    {JSON.stringify(filter, null, 2)}
                  </Code>
                </TabsContent>
                <TabsContent value="sql">
                  <Code className="w-full h-64 overflow-auto p-4">
                    {toSqlWhereClause(filter)}
                  </Code>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Saved filters and actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Save Filter</CardTitle>
              <CardDescription>
                Save your current filter for future use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-name">Filter Name</Label>
                  <Input
                    id="filter-name"
                    placeholder="My Filter"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-global"
                    checked={isGlobal}
                    onCheckedChange={(checked) => setIsGlobal(!!checked)}
                  />
                  <Label htmlFor="is-global">
                    Make filter global (available to all users)
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveFilter}
                disabled={isSaving || !filterId}
                className="w-full"
              >
                <SaveIcon className="h-4 w-4 mr-1" />
                {filterId ? "Update Filter" : "Save Filter"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved Filters</CardTitle>
              <CardDescription>Your previously saved filters</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingFilters ? (
                <div className="text-center py-4">Loading filters...</div>
              ) : filtersArray.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No saved filters yet
                </div>
              ) : (
                <div className="space-y-2">
                  {filtersArray.map((filter) => (
                    <div
                      key={filter.id}
                      className={`p-3 rounded-md border ${
                        filterId === filter.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {filter.name || "Unnamed Filter"}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Last used: {formatDate(filter.last_used)}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {filter.is_global && (
                            <Badge variant="outline">Global</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilterId(filter.id)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteFilter(filter.id)}
                          disabled={isDeleting}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {filterId && (
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterId(null)}
                >
                  Create New Filter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsUsed(filterId)}
                >
                  Mark as Used
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filter Information</CardTitle>
              <CardDescription>
                Details about the current filter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {filterId ? (
                    <Badge variant="outline" className="bg-primary/10">
                      Saved Filter
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted">
                      Unsaved
                    </Badge>
                  )}
                </div>
                {currentSavedFilter && (
                  <>
                    <Separator />
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {currentSavedFilter.name || "Unnamed Filter"}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {formatDate(currentSavedFilter.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Last Used:</span>{" "}
                      {formatDate(currentSavedFilter.last_used)}
                    </div>
                    <div>
                      <span className="font-medium">Created By:</span>{" "}
                      {currentSavedFilter.created_by || "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Global:</span>{" "}
                      {currentSavedFilter.is_global ? "Yes" : "No"}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
