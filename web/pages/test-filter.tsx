import React, { useState, useEffect } from "react";
import FilterASTEditor from "@/filterAST/FilterASTEditor";
import { H1, H4, P } from "@/components/ui/typography";
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
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ChevronRight, Info, RefreshCcw, Save, Trash2 } from "lucide-react";
import FilterPills from "@/filterAST/components/FilterPills";

const TestFilterPage: React.FC = () => {
  const filterStore = useFilterStore();
  const [currentFilter, setCurrentFilter] = useState<FilterExpression | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState("visual-editor");
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Update local state whenever store filter changes
  useEffect(() => {
    setCurrentFilter(filterStore.filter);
  }, [filterStore.filter]);

  // Handler for when the filter changes in the editor
  const handleFilterChange = (filter: FilterExpression) => {
    setCurrentFilter(filter);
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

  // Clear filter
  const clearFilter = () => {
    filterStore.setFilter({
      type: "and",
      expressions: [],
    });
  };

  // Toggle filter collapse state
  const toggleFilterCollapse = () => {
    setIsFilterCollapsed(!isFilterCollapsed);
  };

  return (
    <BasePageV2>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <H1>Filter Test Page</H1>
            <P className="text-muted-foreground">
              Test and explore the new FilterASTEditor component with various
              examples
            </P>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilter}>
              <RefreshCcw size={16} className="mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFilterCollapse}>
              {isFilterCollapsed ? "Expand Filters" : "Collapse Filters"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Filter examples */}
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
          </div>

          {/* Right columns - Editor and JSON view */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Pills Component */}
            {isFilterCollapsed ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Active Filters</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFilterCollapse}
                    >
                      Expand
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FilterPills maxPills={10} />
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="visual-editor" onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual-editor">Visual Editor</TabsTrigger>
                  <TabsTrigger value="json-view">JSON View</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="visual-editor"
                  className="border rounded-lg p-4"
                >
                  <FilterASTEditor
                    onFilterChange={handleFilterChange}
                    layoutPage="requests"
                  />
                </TabsContent>

                <TabsContent
                  value="json-view"
                  className="border rounded-lg p-4"
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

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md overflow-auto max-h-[500px]">
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
            )}
          </div>
        </div>

        {/* FilterPills Demo Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Filter Pills Component Demo</CardTitle>
              <CardDescription>
                This demonstrates how the FilterPills component can be used in
                other contexts, such as in a search bar or as a summary of
                applied filters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                <div className="mb-2">
                  <Label>Example: Filter Pills in Search Bar</Label>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-white dark:bg-slate-800">
                  <span className="text-muted-foreground">Search:</span>
                  <div className="flex-1">
                    <FilterPills maxPills={3} className="py-1" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                <div className="mb-2">
                  <Label>Example: Filter Summary</Label>
                </div>
                <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                  <P className="text-sm mb-2">Applied Filters:</P>
                  <FilterPills maxPills={5} />
                </div>
              </div>

              <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                <div className="mb-2">
                  <Label>Example: Inline Filter Pills</Label>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-medium">Filtered by:</span>
                  <FilterPills maxPills={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BasePageV2>
  );
};

export default TestFilterPage;
