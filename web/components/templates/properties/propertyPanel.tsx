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
import { SimpleTable } from "../../shared/table/simpleTable";

// ShadCN components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lucide icons (modern alternative to Heroicons)
import { Tag, DollarSign, Table2, Clock, ExternalLink } from "lucide-react";
import PropertyTopCosts from "./propertyTopCosts";
import { Row } from "@/components/layout/common";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { H3, P } from "@/components/ui/typography";

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

  const { keyMetrics, valueMetrics, isAnyLoading } = usePropertyCard({
    timeFilter,
    property,
    limit: showMore ? 100 : 11,
    sortKey: sortConfig.key,
    sortDirection: sortConfig.direction,
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
        <div className="mx-4 flex flex-col items-center justify-between md:flex-row">
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
          <Card className="mt-4 flex w-full items-center justify-center rounded-none border-0 bg-background py-16 shadow-none dark:bg-sidebar-background">
            <CardContent className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-accent p-4 dark:bg-sidebar-accent">
                <Tag className="h-8 w-8 text-primary dark:text-sidebar-primary" />
              </div>
              <H3 className="mb-2">No Property Selected</H3>
              <P className="max-w-sm text-muted-foreground dark:text-sidebar-foreground">
                Please select a property from the sidebar to view its metrics
              </P>
            </CardContent>
          </Card>
        ) : (
          <div className="flex w-full flex-col gap-6 py-4">
            <TabsContent value="overview" className="flex flex-col gap-6">
              <div className="mx-4 flex flex-wrap gap-4">
                <Card className="min-w-[250px] flex-1 rounded-lg border border-border bg-card shadow-sm dark:border-sidebar-border dark:bg-sidebar-background">
                  <CardContent className="flex items-center p-4">
                    <div className="mr-4 rounded-full bg-primary/10 p-3 dark:bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary dark:text-sidebar-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-sidebar-foreground">
                        Cost
                      </p>
                      {isAnyLoading ? (
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-7 w-24 bg-accent dark:bg-sidebar-accent" />
                        </div>
                      ) : (
                        <p className="text-2xl font-semibold text-foreground dark:text-sidebar-foreground">
                          {keyMetrics.totalCost.data?.data
                            ? `$${keyMetrics.totalCost.data?.data.toFixed(5)}`
                            : "$0.00"}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="min-w-[250px] flex-1 rounded-lg border border-border bg-card shadow-sm dark:border-sidebar-border dark:bg-sidebar-background">
                  <CardContent className="flex items-center p-4">
                    <div className="mr-4 rounded-full bg-pink-50/80 p-3 dark:bg-pink-900/20">
                      <Table2 className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Requests
                      </p>
                      {isAnyLoading ? (
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-7 w-24 bg-accent dark:bg-sidebar-accent" />
                        </div>
                      ) : (
                        <p className="text-2xl font-semibold">
                          {
                            +(
                              keyMetrics.totalRequests?.data?.data?.toFixed(
                                2,
                              ) ?? 0
                            )
                          }
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="min-w-[250px] flex-1 rounded-lg border border-border bg-card shadow-sm dark:border-sidebar-border dark:bg-sidebar-background">
                  <CardContent className="flex items-center p-4">
                    <div className="mr-4 rounded-full bg-purple-50/80 p-3 dark:bg-purple-900/20">
                      <Clock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Average Latency / Req
                      </p>
                      {isAnyLoading ? (
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-7 w-24 bg-accent dark:bg-sidebar-accent" />
                        </div>
                      ) : (
                        <p className="text-2xl font-semibold">
                          {keyMetrics.averageLatency.data?.data
                            ? (
                                keyMetrics.averageLatency.data.data / 1000
                              ).toFixed(2)
                            : "0.00"}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isAnyLoading ? (
                <Card className="w-full rounded-lg border border-border bg-background shadow-sm dark:border-sidebar-border dark:bg-sidebar-background">
                  <CardContent className="overflow-auto p-0">
                    <div className="min-w-[800px] bg-background dark:bg-sidebar-background">
                      <Table className="w-full bg-background dark:bg-sidebar-background">
                        <TableHeader>
                          <TableRow className="sticky top-0 bg-background shadow-sm dark:bg-sidebar-background">
                            {[
                              "Value",
                              "Requests",
                              "Cost",
                              "Avg Prompt Tokens",
                              "Avg Comp Tokens",
                              "Avg Latency",
                              "Avg Cost",
                            ].map((header, index) => (
                              <TableHead
                                key={index}
                                className={`relative text-[12px] font-semibold text-foreground dark:text-sidebar-foreground ${
                                  index === 0 ? "pl-10" : ""
                                }`}
                              >
                                {header}
                                {index < 6 && (
                                  <div className="absolute right-0 top-0 h-full w-px bg-border dark:bg-sidebar-border" />
                                )}
                                <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-border dark:bg-sidebar-border" />
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-sm">
                          {Array.from({ length: 10 }).map((_, rowIndex) => (
                            <TableRow key={`skeleton-row-${rowIndex}`}>
                              {Array.from({ length: 7 }).map((_, colIndex) => (
                                <TableCell
                                  key={`skeleton-cell-${rowIndex}-${colIndex}`}
                                  className={`border-t border-border px-2 py-3 text-foreground dark:border-sidebar-border dark:text-sidebar-foreground ${
                                    colIndex === 0 ? "pl-10" : ""
                                  } ${
                                    colIndex === 6
                                      ? "border-r border-border pr-10 dark:border-sidebar-border"
                                      : ""
                                  }`}
                                >
                                  <Skeleton
                                    className={`h-5 ${
                                      colIndex === 0 ? "w-32" : "w-16"
                                    } bg-accent dark:bg-sidebar-accent`}
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full rounded-lg border border-border bg-background shadow-sm dark:border-sidebar-border dark:bg-sidebar-background">
                  <CardContent className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <SimpleTable
                        className="w-full min-w-[800px]"
                        data={cleanedValueData}
                        columns={[
                          {
                            key: "property_value" as keyof (typeof cleanedValueData)[0],
                            header: "Value",
                            sortable: true,
                            render: (propertyValue) => (
                              <div className="overflow-hidden">
                                <Button
                                  variant="link"
                                  className="flex h-auto items-center truncate p-0 font-semibold"
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
                                  {propertyValue.property_value}
                                  <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                </Button>
                              </div>
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
                  </CardContent>
                </Card>
              )}

              {propertyValueData.length > 10 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowMore(!showMore)}
                  >
                    {showMore ? "Show Less" : "Show More"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="flex flex-col gap-6">
              <PropertyTopCosts property={property} timeFilter={timeFilter} />
            </TabsContent>
          </div>
        )}
      </div>
    </Tabs>
  );
};

export default PropertyPanel;
