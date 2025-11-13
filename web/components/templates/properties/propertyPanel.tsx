import { useRouter } from "next/router";
import { usePropertyCard } from "./useProperty";
import { useState } from "react";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import {
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
  getPropertyFiltersV2,
} from "@helicone-package/filters/frontendFilterDefs";
import ExportButton from "../../shared/themed/table/exportButton";
import { UIFilterRow } from "@helicone-package/filters/types";
import useSearchParams from "../../shared/utils/useSearchParams";
import { formatNumber } from "../users/initialColumns";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tag,
  ExternalLink,
  ChevronDown,
  Trash2,
  LockIcon,
  MoreVertical,
  Table,
  PieChart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleTable } from "../../shared/table/simpleTable";
import { Small, XSmall, Muted } from "@/components/ui/typography";
import { PropertyAnalyticsCharts } from "./PropertyAnalyticsCharts";
import { useLocalStorage } from "@/services/hooks/localStorage";

import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { FilterASTButton } from "@/filterAST/FilterASTButton";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PropertyPanelProps {
  property: string;
  properties: string[];
  allProperties: string[];
  onPropertySelect: (property: string) => void;
  onDeleteProperty: (property: string) => void;
  onRestoreProperties: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasAccess: boolean;
  freeLimit: number;
  hidingKey: string | null;
}

const TABS = [
  {
    id: "table",
    label: "Table",
    icon: <Table size={16} />,
  },
  {
    id: "charts",
    label: "Charts",
    icon: <PieChart size={16} />,
  },
];

const PropertyPanel = (props: PropertyPanelProps) => {
  const {
    property,
    properties,
    allProperties,
    onPropertySelect,
    onDeleteProperty,
    onRestoreProperties,
    searchQuery,
    onSearchChange,
    hasAccess,
    freeLimit,
    hidingKey,
  } = props;
  const searchParams = useSearchParams();

  const [showMore, setShowMore] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("property-view-tab", "table");
  const router = useRouter();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval,
  );

  const getInitialTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const [, startDate, endDate] = currentTimeFilter.split("_");
      return {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    } else if (currentTimeFilter) {
      return {
        start: getTimeIntervalAgo(currentTimeFilter as TimeInterval),
        end: new Date(),
      };
    }
    return {
      start: getTimeIntervalAgo("1m"),
      end: new Date(),
    };
  };

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>(getInitialTimeFilter());

  // Add state for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string | undefined;
    direction: "asc" | "desc";
  }>({
    key: "total_requests",
    direction: "desc",
  });

  const filterStore = useFilterStore();
  const userFilters = filterStore.filter
    ? toFilterNode(filterStore.filter)
    : "all";

  const { keyMetrics, valueMetrics, isAnyLoading } = usePropertyCard({
    timeFilter,
    property,
    limit: showMore ? 100 : 11,
    sortKey: sortConfig.key,
    sortDirection: sortConfig.direction,
    userFilters,
  });

  const { propertyFilters } = useGetPropertiesV2(getPropertyFiltersV2);

  const filterMap = (REQUEST_TABLE_FILTERS as SingleFilterDef<any>[]).concat(
    Array.isArray(propertyFilters) ? propertyFilters : [],
  );

  function encodeFilter(filter: UIFilterRow): string {
    return `${filterMap[filter.filterMapIdx].label}:${
      filterMap[filter.filterMapIdx].operators[filter.operatorIdx].label
    }:${filter.value}`;
  }

  const propertyValueData =
    valueMetrics.aggregatedKeyMetrics?.data?.data?.map((d) => ({
      ...d,
      average_cost_per_request: d.total_cost / d.total_requests,
      avg_latency_per_request: d.avg_latency_per_request / 1000,
    })) ?? [];

  const getPropertyValueData = () => {
    if (showMore) {
      return propertyValueData;
    } else {
      return propertyValueData?.slice(0, 10);
    }
  };

  const cleanedValueData = getPropertyValueData();

  // Helper function to get TimeFilter object
  const getTimeFilterObject = (start: Date, end: Date) => ({
    start,
    end,
  });

  // Callback for ThemedTimeFilter
  const onTimeSelectHandler = (key: string, value: string) => {
    if (key === "custom") {
      const [startDate, endDate] = value.split("_");
      setTimeFilter({
        start: new Date(startDate),
        end: new Date(endDate),
      });
      setInterval(key as TimeInterval);

      // Update URL with custom time range
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            t: `custom_${startDate}_${endDate}`,
          },
        },
        undefined,
        { shallow: true },
      );
    } else {
      setTimeFilter({
        start: getTimeIntervalAgo(key as TimeInterval),
        end: new Date(),
      });
      setInterval(key as TimeInterval);

      // Update URL with predefined interval
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            t: key,
          },
        },
        undefined,
        { shallow: true },
      );
    }
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => setCurrentTab(value)}
      className="flex h-full w-full flex-col"
    >
      <div className="mb-1 w-full">
        <div className="flex flex-col">
          <FoldedHeader
            leftSection={
              <section className="flex flex-row items-center gap-2">
                <Link href="/properties" className="no-underline">
                  <Small className="font-semibold">Properties</Small>
                </Link>
                <Small className="font-semibold">/</Small>

                <Popover
                  open={propertyDropdownOpen}
                  onOpenChange={setPropertyDropdownOpen}
                >
                  <PopoverTrigger
                    asChild
                    className={cn(
                      "flex h-8 w-[180px] items-center justify-between rounded-md border border-sky-200 bg-white px-3 py-2 text-xs ring-offset-white placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sidebar-background",
                      "focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300",
                    )}
                  >
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={propertyDropdownOpen}
                    >
                      {property || "Select property"}
                      <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search properties..."
                        onChangeCapture={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) => {
                          onSearchChange(e.target.value);
                        }}
                      />
                      <CommandEmpty>No results found.</CommandEmpty>

                      <CommandList>
                        {properties.map((prop, i) => {
                          const originalIndex = allProperties.indexOf(prop);
                          const requiresPremium =
                            !hasAccess && originalIndex >= freeLimit;

                          if (requiresPremium) {
                            return (
                              <FreeTierLimitWrapper
                                key={i}
                                feature="properties"
                                itemCount={allProperties.length}
                              >
                                <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground">
                                  <LockIcon className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate text-sm">
                                    {prop}
                                  </span>
                                </div>
                              </FreeTierLimitWrapper>
                            );
                          }

                          return (
                            <CommandItem
                              key={i}
                              value={prop}
                              onSelect={() => {
                                setPropertyDropdownOpen(false);
                                onPropertySelect(prop);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  property === prop
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {prop}
                            </CommandItem>
                          );
                        })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <ThemedTimeFilter
                  currentTimeFilter={getTimeFilterObject(
                    timeFilter.start,
                    timeFilter.end,
                  )}
                  timeFilterOptions={[]}
                  onSelect={onTimeSelectHandler}
                  isFetching={isAnyLoading}
                  defaultValue={interval}
                  custom={true}
                />

                <FilterASTButton />
              </section>
            }
            rightSection={
              <section className="flex flex-row items-center gap-2">
                <div className="flex h-8 flex-row items-center divide-x divide-border overflow-hidden rounded-lg border border-border shadow-sm">
                  <label className="px-2 py-1 text-xs">Views</label>

                  <TabsList
                    size={"sm"}
                    variant={"secondary"}
                    asPill={"none"}
                    className="divide-x divide-border"
                  >
                    {TABS.map((tab) => (
                      <TabsTrigger
                        variant={"secondary"}
                        asPill={"none"}
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 bg-sidebar-background dark:bg-sidebar-foreground"
                      >
                        {tab.icon}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDeleteProperty(property)}
                      disabled={!property || hidingKey === property}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete {property ? `"${property}"` : "property"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRestoreProperties}>
                      Restore deleted properties
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ExportButton
                  rows={cleanedValueData.map((propertyValue) => ({
                    Value: propertyValue.property_value,
                    Requests: propertyValue.total_requests,
                    Cost: propertyValue.total_cost,
                    "Avg Prompt Tokens":
                      propertyValue.avg_prompt_tokens_per_request,
                    "Avg Comp Tokens":
                      propertyValue.avg_completion_tokens_per_request,
                    "Avg Latency": propertyValue.avg_latency_per_request,
                    "Avg Cost": propertyValue.average_cost_per_request,
                  }))}
                />
              </section>
            }
            showFold={false}
          />

          {property === "" ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Tag className="h-6 w-6 text-muted-foreground" />
                </div>
                <Small className="mb-2 font-semibold">
                  No Property Selected
                </Small>
                <Muted className="text-xs">
                  Please select a property from the sidebar to view its metrics
                </Muted>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="table" className="min-h-0 flex-1">
                {isAnyLoading ? (
                  <div className="w-full pt-0">
                    <div className="space-y-3 px-4">
                      <div className="flex items-center gap-4">
                        {[
                          "Value",
                          "Requests",
                          "Cost",
                          "Avg Prompt Tokens",
                          "Avg Comp Tokens",
                          "Avg Latency",
                          "Avg Cost",
                        ].map((header) => (
                          <div key={header} className="flex-1">
                            <XSmall className="mb-2 font-medium text-muted-foreground">
                              {header}
                            </XSmall>
                            <Skeleton className="h-5 w-full bg-muted" />
                          </div>
                        ))}
                      </div>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <div key={j} className="flex-1">
                              <Skeleton className="h-5 w-full bg-muted" />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto pt-0">
                    <SimpleTable
                      className="w-full px-4"
                      data={cleanedValueData}
                      columns={[
                        {
                          key: "property_value" as keyof (typeof cleanedValueData)[0],
                          header: "Value",
                          sortable: true,
                          render: (propertyValue) => (
                            <button
                              className="flex items-center gap-1 text-left font-medium text-foreground hover:text-primary"
                              title={propertyValue.property_value}
                              onClick={() => {
                                const value = propertyValue.property_value;
                                const filterMapIndex = filterMap.findIndex(
                                  (f) => f.label === property,
                                );
                                const currentAdvancedFilters =
                                  encodeURIComponent(
                                    JSON.stringify({
                                      filter: [
                                        {
                                          filterMapIdx: filterMapIndex,
                                          operatorIdx: 0,
                                          value,
                                        },
                                      ]
                                        .map(encodeFilter)
                                        .join("|"),
                                    }),
                                  );

                                router.push({
                                  pathname: "/requests",
                                  query: {
                                    t: "3m",
                                    filters: currentAdvancedFilters,
                                  },
                                });
                              }}
                            >
                              <span className="truncate">
                                {propertyValue.property_value}
                              </span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            </button>
                          ),
                        },
                        {
                          key: "total_requests" as keyof (typeof cleanedValueData)[0],
                          header: "Requests",
                          sortable: true,
                          render: (propertyValue) =>
                            propertyValue.total_requests,
                        },
                        {
                          key: "total_cost" as keyof (typeof cleanedValueData)[0],
                          header: "Cost",
                          sortable: true,
                          render: (propertyValue) =>
                            `$${formatNumber(propertyValue.total_cost, 6)}`,
                        },
                        {
                          key: "avg_prompt_tokens_per_request" as keyof (typeof cleanedValueData)[0],
                          header: "Avg Prompt Tokens",
                          sortable: true,
                          render: (propertyValue) =>
                            formatNumber(
                              propertyValue.avg_prompt_tokens_per_request,
                              6,
                            ),
                        },
                        {
                          key: "avg_completion_tokens_per_request" as keyof (typeof cleanedValueData)[0],
                          header: "Avg Comp Tokens",
                          sortable: true,
                          render: (propertyValue) =>
                            formatNumber(
                              propertyValue.avg_completion_tokens_per_request,
                              6,
                            ),
                        },
                        {
                          key: "avg_latency_per_request" as keyof (typeof cleanedValueData)[0],
                          header: "Avg Latency",
                          sortable: true,
                          render: (propertyValue) =>
                            formatNumber(
                              propertyValue.avg_latency_per_request,
                              6,
                            ),
                        },
                        {
                          key: "average_cost_per_request" as keyof (typeof cleanedValueData)[0],
                          header: "Avg Cost",
                          sortable: true,
                          render: (propertyValue) =>
                            `$${formatNumber(
                              propertyValue.average_cost_per_request,
                              6,
                            )}`,
                        },
                      ]}
                      emptyMessage="No property data available"
                      onSort={(
                        key: keyof (typeof cleanedValueData)[0] | undefined,
                        direction: "asc" | "desc",
                      ) => {
                        setSortConfig({
                          key: key as string,
                          direction,
                        });
                      }}
                      currentSortKey={sortConfig.key}
                      currentSortDirection={sortConfig.direction}
                    />
                  </div>
                )}

                {propertyValueData.length > 10 && (
                  <div className="flex justify-center p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMore(!showMore)}
                    >
                      {showMore ? "Show Less" : "Show More"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="charts" className="min-h-0 flex-1">
                <PropertyAnalyticsCharts
                  property={property}
                  timeFilter={timeFilter}
                  propertyValueData={propertyValueData}
                />
              </TabsContent>
            </>
          )}
        </div>
      </div>
    </Tabs>
  );
};

export default PropertyPanel;
