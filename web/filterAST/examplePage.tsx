import React, { useState, useEffect } from "react";
import FilterASTEditor from "@/filterAST/FilterASTEditor";
import { H1, H4, P, Small } from "@/components/ui/typography";
import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
} from "@/filterAST/filterAst";
import BasePageV2 from "@/components/layout/basePageV2";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  Info,
  RefreshCcw,
  Save,
  Share2,
  Trash2,
  Check,
  Clock,
  Link,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFilterAST } from "@/filterAST/context/filterContext";

export const TestFilterPage: React.FC = () => {
  const filterStore = useFilterStore();
  const [currentFilter, setCurrentFilter] = useState<FilterExpression | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState("visual-editor");
  const [filterName, setFilterName] = useState("Untitled Filter");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Use the enhanced useSavedFilters hook
  const { store, actions, navigation, crud, helpers } = useFilterAST();

  // Update local state whenever store filter changes
  useEffect(() => {
    setCurrentFilter(filterStore.filter);
  }, [filterStore.filter]);

  // Update filter name when active filter changes
  useEffect(() => {
    if (store.activeFilterId) {
      const activeFilter = crud.savedFilters.find(
        (filter) => filter.id === store.activeFilterId
      );
      if (activeFilter) {
        setFilterName(activeFilter.name);
      }
    }
  }, [store.activeFilterId, crud.savedFilters]);

  // Handler for when the filter changes in the editor
  const handleFilterChange = (filter: FilterExpression) => {
    setCurrentFilter(filter);
  };

  // Handler for saving the current filter
  const handleSaveFilter = async () => {
    if (!currentFilter) return;

    try {
      await helpers.saveFilter(filterName, currentFilter);
      toast.success("Filter saved", {
        description: "Your filter has been saved successfully.",
      });
    } catch (error) {
      toast.error("Error saving filter", {
        description: "There was an error saving your filter.",
      });
    }
  };

  // Handler for deleting the current filter
  const handleDeleteFilter = async () => {
    if (!store.activeFilterId) return;

    try {
      await helpers.deleteFilter(store.activeFilterId);
      filterStore.setFilter({
        type: "and",
        expressions: [],
      });
      setFilterName("Untitled Filter");
      toast.success("Filter deleted", {
        description: "Your filter has been deleted successfully.",
      });
    } catch (error) {
      toast.error("Error deleting filter", {
        description: "There was an error deleting your filter.",
      });
    }
  };

  // Handler for creating a new filter
  const handleNewFilter = () => {
    filterStore.clearActiveFilter();
    setFilterName("Untitled Filter");
    filterStore.setFilter({
      type: "and",
      expressions: [],
    });
  };

  // Handler for copying the shareable URL
  const handleCopyShareableUrl = () => {
    const url = helpers.getShareableUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("URL copied", {
        description: "Shareable filter URL has been copied to clipboard.",
      });
      setIsShareDialogOpen(false);
    }
  };

  // Example of programmatically creating a simple filter
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
        {
          type: "condition",
          field: { column: "latency" },
          operator: "gt",
          value: 1000,
        },
      ],
    };

    filterStore.setFilter(simpleFilter);
  };

  // Example of programmatically creating a complex filter
  const createComplexFilter = () => {
    const complexFilter: AndExpression = {
      type: "and",
      expressions: [
        {
          type: "condition",
          field: { column: "user_id" },
          operator: "eq",
          value: "test-user-123",
        },
        {
          type: "or",
          expressions: [
            {
              type: "condition",
              field: { column: "status" },
              operator: "eq",
              value: 200,
            },
            {
              type: "condition",
              field: { column: "status" },
              operator: "eq",
              value: 201,
            },
          ],
        },
        {
          type: "and",
          expressions: [
            {
              type: "condition",
              field: { column: "latency" },
              operator: "gte",
              value: 500,
            },
            {
              type: "condition",
              field: { column: "latency" },
              operator: "lte",
              value: 2000,
            },
          ],
        },
      ],
    };

    filterStore.setFilter(complexFilter);
  };

  // Generate a filter with a property condition
  const createPropertyFilter = () => {
    const propertyFilter: AndExpression = {
      type: "and",
      expressions: [
        {
          type: "condition",
          field: {
            column: "properties",
            subtype: "property",
            key: "user_type",
          },
          operator: "eq",
          value: "admin",
        },
      ],
    };

    filterStore.setFilter(propertyFilter);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <H1>Filter Test Page</H1>
          <P className="text-muted-foreground">
            Test and explore the new FilterASTEditor component with shareable
            URLs
          </P>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNewFilter}>
            <RefreshCcw size={16} className="mr-1" />
            New Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Filter examples and saved filters */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Example Filters</CardTitle>
              <CardDescription>
                Click on any example to load it into the editor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={createSimpleFilter}
                >
                  <ChevronRight size={16} className="mr-2" />
                  Simple Filter (Status and Latency)
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={createComplexFilter}
                >
                  <ChevronRight size={16} className="mr-2" />
                  Complex Nested Filter
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={createPropertyFilter}
                >
                  <ChevronRight size={16} className="mr-2" />
                  Custom Property Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved Filters</CardTitle>
              <CardDescription>Your previously saved filters</CardDescription>
            </CardHeader>
            <CardContent>
              {crud.savedFilters.length === 0 ? (
                <P className="text-muted-foreground text-sm">
                  No saved filters yet. Create and save a filter to see it here.
                </P>
              ) : (
                <div className="space-y-2">
                  {crud.savedFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={
                        store.activeFilterId === filter.id
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        if (filter.id) helpers.loadFilterById(filter.id);
                      }}
                    >
                      <ChevronRight size={16} className="mr-2" />
                      {filter.name}
                      {store.activeFilterId === filter.id && (
                        <Check
                          size={16}
                          className="ml-2 text-primary-foreground"
                        />
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right columns - Editor and JSON view */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <Input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Filter Name"
                  />
                </div>
                <div className="flex gap-2">
                  <Dialog
                    open={isShareDialogOpen}
                    onOpenChange={setIsShareDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!store.activeFilterId}
                      >
                        <Share2 size={16} className="mr-1" />
                        Share
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Filter</DialogTitle>
                        <DialogDescription>
                          Copy this URL to share your filter with others
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-2 mt-4">
                        <Input
                          value={helpers.getShareableUrl() || ""}
                          readOnly
                        />
                        <Button onClick={handleCopyShareableUrl}>
                          <Link size={16} className="mr-1" />
                          Copy
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveFilter}
                    disabled={crud.isSaving}
                  >
                    {crud.isSaving ? (
                      <Clock size={16} className="mr-1 animate-spin" />
                    ) : (
                      <Save size={16} className="mr-1" />
                    )}
                    Save
                  </Button>

                  {store.activeFilterId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteFilter}
                      disabled={crud.isDeleting}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              {store.hasUnsavedChanges && (
                <Small className="text-muted-foreground mt-1">
                  <Clock size={12} className="inline mr-1" />
                  Unsaved changes will be automatically saved
                </Small>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="visual-editor" onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual-editor">Visual Editor</TabsTrigger>
                  <TabsTrigger value="json-view">JSON View</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="visual-editor"
                  className="border rounded-lg p-4 min-h-[400px]"
                >
                  <FilterASTEditor
                    onFilterChange={handleFilterChange}
                    layoutPage="requests"
                  />
                </TabsContent>

                <TabsContent
                  value="json-view"
                  className="border rounded-lg p-4 min-h-[400px]"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <H4>Filter JSON Structure</H4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTab("visual-editor")}
                      >
                        Edit in Visual Editor
                      </Button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md overflow-auto max-h-[300px]">
                      <pre className="text-sm">
                        {JSON.stringify(currentFilter, null, 2)}
                      </pre>
                    </div>

                    <div className="border-t pt-4">
                      <Label>Filter Explanation</Label>
                      <P className="text-muted-foreground text-sm mt-2">
                        {currentFilter &&
                        currentFilter.type === "and" &&
                        currentFilter.expressions.length > 0 ? (
                          <>
                            This filter has {currentFilter.expressions.length}{" "}
                            expression(s) combined with AND logic.
                            {currentFilter.expressions.some(
                              (expr) =>
                                expr.type === "or" || expr.type === "and"
                            ) &&
                              " It contains nested groups for more complex filtering."}
                          </>
                        ) : currentFilter &&
                          currentFilter.type === "or" &&
                          currentFilter.expressions.length > 0 ? (
                          <>
                            This filter has {currentFilter.expressions.length}{" "}
                            expression(s) combined with OR logic.
                            {currentFilter.expressions.some(
                              (expr) =>
                                expr.type === "or" || expr.type === "and"
                            ) &&
                              " It contains nested groups for more complex filtering."}
                          </>
                        ) : (
                          "No active filter or empty filter group."
                        )}
                      </P>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Info size={14} className="mr-2" />
                {store.activeFilterId ? (
                  <>
                    This filter is saved and has a shareable URL. Any changes
                    will be automatically saved.
                  </>
                ) : (
                  <>
                    This filter is not saved yet. Click the Save button to
                    create a shareable URL.
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
