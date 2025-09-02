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
import ThemedTableHeader from "../../shared/themed/themedHeader";
import useSearchParams from "../../shared/utils/useSearchParams";
import { formatNumber } from "../users/initialColumns";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, DollarSign, Table2, Clock, ExternalLink } from "lucide-react";
import PropertyTopCosts from "./propertyTopCosts";
import { Row } from "@/components/layout/common";
import { SimpleTable } from "../../shared/table/simpleTable";
import { Small, XSmall, Muted } from "@/components/ui/typography";

interface PropertyPanelProps {
  property: string;
}

const PropertyPanel = (props: PropertyPanelProps) => {
  const { property } = props;
  const searchParams = useSearchParams();

  const [showMore, setShowMore] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

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
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

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

  return (
    <Tabs
      defaultValue="overview"
      value={activeTab}
      onValueChange={setActiveTab}
      className="mb-1 w-full"
    >
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-between p-4 md:flex-row">
          <Row className="flex-wrap items-center gap-2">
            <TabsList variant={"default"} className="mb-2 sm:mb-0">
              <TabsTrigger value="overview" className="text-sm font-medium">
                Overview
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-sm font-medium">
                Metrics
              </TabsTrigger>
            </TabsList>

            <ThemedTableHeader
              isFetching={false}
              timeFilter={{
                currentTimeFilter: timeFilter,
                customTimeFilter: true,
                timeFilterOptions: [],
                defaultTimeFilter: interval,
                onTimeSelectHandler: (key: TimeInterval, value: string) => {
                  if ((key as string) === "custom") {
                    value = value.replace("custom:", "");
                    const start = new Date(value.split("_")[0]);
                    const end = new Date(value.split("_")[1]);
                    setInterval(key);
                    setTimeFilter({
                      start,
                      end,
                    });
                  } else {
                    setInterval(key);
                    setTimeFilter({
                      start: getTimeIntervalAgo(key),
                      end: new Date(),
                    });
                  }
                },
              }}
            />
          </Row>
          <ExportButton
            rows={cleanedValueData.map((propertyValue) => ({
              Value: propertyValue.property_value,
              Requests: propertyValue.total_requests,
              Cost: propertyValue.total_cost,
              "Avg Prompt Tokens": propertyValue.avg_prompt_tokens_per_request,
              "Avg Comp Tokens":
                propertyValue.avg_completion_tokens_per_request,
              "Avg Latency": propertyValue.avg_latency_per_request,
              "Avg Cost": propertyValue.average_cost_per_request,
            }))}
          />
        </div>

        {property === "" ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <Small className="mb-2 font-semibold">No Property Selected</Small>
              <Muted className="text-xs">
                Please select a property from the sidebar to view its metrics
              </Muted>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col pt-6">
            <TabsContent value="overview" className="flex flex-col pt-0">
              <div className="flex">
                <div className="flex min-w-[140px] flex-1 items-center gap-2 border-y border-r border-border bg-background p-3">
                  <div className="rounded bg-emerald-50 p-1 dark:bg-emerald-950">
                    <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <XSmall className="text-muted-foreground">Cost</XSmall>
                    {isAnyLoading ? (
                      <Skeleton className="mt-1 h-5 w-16 bg-muted" />
                    ) : (
                      <div className="mt-0.5 text-lg font-semibold">
                        {keyMetrics.totalCost.data?.data
                          ? `$${keyMetrics.totalCost.data?.data.toFixed(5)}`
                          : "$0.00"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-w-[140px] flex-1 items-center gap-2 border-y border-r border-border bg-background p-3">
                  <div className="rounded bg-blue-50 p-1 dark:bg-blue-950">
                    <Table2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <XSmall className="text-muted-foreground">Requests</XSmall>
                    {isAnyLoading ? (
                      <Skeleton className="mt-1 h-5 w-16 bg-muted" />
                    ) : (
                      <div className="mt-0.5 text-lg font-semibold">
                        {
                          +(
                            keyMetrics.totalRequests?.data?.data?.toFixed(2) ??
                            0
                          )
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-w-[140px] flex-1 items-center gap-2 border-y border-border bg-background p-3">
                  <div className="rounded bg-purple-50 p-1 dark:bg-purple-950">
                    <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <XSmall className="text-muted-foreground">
                      Avg Latency
                    </XSmall>
                    {isAnyLoading ? (
                      <Skeleton className="mt-1 h-5 w-16 bg-muted" />
                    ) : (
                      <div className="mt-0.5 text-lg font-semibold">
                        {keyMetrics.averageLatency.data?.data
                          ? (
                              keyMetrics.averageLatency.data.data / 1000
                            ).toFixed(2)
                          : "0.00"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {isAnyLoading ? (
                <div className="w-full">
                  <div className="space-y-3">
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
                <div className="overflow-x-auto">
                  <SimpleTable
                    className="w-full"
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
                              const currentAdvancedFilters = encodeURIComponent(
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
                        render: (propertyValue) => propertyValue.total_requests,
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
                <div className="flex justify-center p-4">
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

            <TabsContent value="metrics" className="flex flex-col gap-6 pt-0">
              <PropertyTopCosts property={property} timeFilter={timeFilter} />
            </TabsContent>
          </div>
        )}
      </div>
    </Tabs>
  );
};

export default PropertyPanel;
