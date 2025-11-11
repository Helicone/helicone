import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Small } from "@/components/ui/typography";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { formatCurrency as remoteFormatCurrency } from "@/lib/uiUtils";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import PropertyTopCosts from "./propertyTopCosts";
import { useLocalStorage } from "@/services/hooks/localStorage";

const formatCurrency = (amount: number) => {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(6)}`;
  if (amount < 1) return `$${amount.toFixed(4)}`;
  return remoteFormatCurrency(amount, "USD", 2);
};

const formatNumber = (num: number) => {
  if (num === 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1) return num.toFixed(2);
  return num.toFixed(0);
};

const formatAxisCurrency = (value: number) => {
  if (value === 0) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(0)}`;
};

interface PropertyAnalyticsChartsProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
  propertyValueData: Array<{
    total_cost: number;
    total_requests: number;
    [key: string]: any;
  }>;
}

// Chart colors - using Tailwind colors that work in both light and dark mode
const CHART_COLORS = [
  "#4f46e5", // indigo-600
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
];

// Auto-detect time granularity based on date range
const getTimeIncrement = (start: Date, end: Date): "day" | "week" | "month" => {
  const diffInDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffInDays <= 30) return "day";
  if (diffInDays <= 90) return "week";
  return "month";
};

export function PropertyAnalyticsCharts({
  property,
  timeFilter,
  propertyValueData,
}: PropertyAnalyticsChartsProps) {
  const jawn = useJawnClient();
  const filterStore = useFilterStore();
  const userFilters = filterStore.filter
    ? toFilterNode(filterStore.filter)
    : "all";

  const [selectedCostTab, setSelectedCostTab] = useLocalStorage<string>(
    "property-analytics-cost-tab",
    "cost",
  );
  const [selectedRequestsTab, setSelectedRequestsTab] = useLocalStorage<string>(
    "property-analytics-requests-tab",
    "requests",
  );

  const dbIncrement = getTimeIncrement(timeFilter.start, timeFilter.end);

  // Fetch properties over time data
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "propertiesOverTime",
      property,
      timeFilter.start.toISOString(),
      timeFilter.end.toISOString(),
      dbIncrement,
      JSON.stringify(userFilters),
    ],
    queryFn: () =>
      jawn.POST("/v1/property/properties/over-time", {
        body: {
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
          userFilter: userFilters as any,
          dbIncrement: dbIncrement,
          timeZoneDifference: new Date().getTimezoneOffset(),
          propertyKey: property,
        },
      }),
    enabled: !!property,
  });

  const rawData = data?.data?.data || [];

  // Transform data for charts
  const transformedData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        costData: [],
        requestsData: [],
        topPropertiesByCost: [],
        topPropertiesByRequests: [],
        propertyTotals: {},
      };
    }

    type PropertyTotals = Record<
      string,
      { totalCost: number; totalRequests: number }
    >;

    // Group data by property and calculate totals
    const propertyTotals = rawData.reduce((acc: PropertyTotals, item: any) => {
      if (!acc[item.property]) {
        acc[item.property] = { totalCost: 0, totalRequests: 0 };
      }
      acc[item.property].totalCost += Number(item.total_cost) || 0;
      acc[item.property].totalRequests += Number(item.request_count) || 0;
      return acc;
    }, {} as PropertyTotals);

    // Get top 10 properties by cost
    const topPropertiesByCost = Object.entries(propertyTotals)
      .sort((a, b) => b[1].totalCost - a[1].totalCost)
      .slice(0, 10)
      .map(([prop]) => prop);

    // Get top 10 properties by requests
    const topPropertiesByRequests = Object.entries(propertyTotals)
      .sort((a, b) => b[1].totalRequests - a[1].totalRequests)
      .slice(0, 10)
      .map(([prop]) => prop);

    // Group data by timestamp
    type TimeData = Record<string, { cost: number; requests: number }>;
    const timeMap = new Map<string, TimeData>();

    rawData.forEach((item: any) => {
      const timestamp = item.created_at_trunc;
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, {});
      }
      const timeData = timeMap.get(timestamp)!;
      if (!timeData[item.property]) {
        timeData[item.property] = { cost: 0, requests: 0 };
      }
      timeData[item.property].cost += Number(item.total_cost) || 0;
      timeData[item.property].requests += Number(item.request_count) || 0;
    });

    // Create chart data for cost
    const costData = Array.from(timeMap.entries())
      .map(([timestamp, properties]) => {
        const date = new Date(timestamp);
        const dataPoint: Record<string, any> = {
          date: date.getTime(),
          dateLabel: format(date, "MMM d, yyyy h:mm a"),
        };
        topPropertiesByCost.forEach((prop) => {
          dataPoint[prop] = Number(properties[prop]?.cost) || 0;
        });
        return dataPoint;
      })
      .sort((a, b) => a.date - b.date);

    // Create chart data for requests
    const requestsData = Array.from(timeMap.entries())
      .map(([timestamp, properties]) => {
        const date = new Date(timestamp);
        const dataPoint: Record<string, any> = {
          date: date.getTime(),
          dateLabel: format(date, "MMM d, yyyy h:mm a"),
        };
        topPropertiesByRequests.forEach((prop) => {
          dataPoint[prop] = Number(properties[prop]?.requests) || 0;
        });
        return dataPoint;
      })
      .sort((a, b) => a.date - b.date);

    return {
      costData,
      requestsData,
      topPropertiesByCost,
      topPropertiesByRequests,
      propertyTotals,
    };
  }, [rawData]);

  // Create chart configs
  const costChartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    transformedData.topPropertiesByCost?.forEach((prop, index) => {
      config[prop] = {
        label: prop,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [transformedData.topPropertiesByCost]);

  const requestsChartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    transformedData.topPropertiesByRequests?.forEach((prop, index) => {
      config[prop] = {
        label: prop,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [transformedData.topPropertiesByRequests]);

  // Calculate totals from propertyValueData (from the table)
  const totalCost = propertyValueData.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0,
  );
  const totalRequests = propertyValueData.reduce(
    (sum, item) => sum + Number(item.total_requests || 0),
    0,
  );

  if (!property) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b border-r border-border bg-card p-6">
          <Skeleton className="h-10 w-48 bg-muted" />
          <Skeleton className="mt-4 h-[300px] w-full bg-muted" />
        </div>
        <div className="border-b border-r border-border bg-card p-6">
          <Skeleton className="h-10 w-48 bg-muted" />
          <Skeleton className="mt-4 h-[300px] w-full bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex h-[400px] items-center justify-center border-b border-r border-border bg-card p-6">
          <Small className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Error loading analytics data"}
          </Small>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {/* Cost Analytics Card */}
      <div className="flex flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
        <Tabs
          value={selectedCostTab}
          onValueChange={setSelectedCostTab}
          className="flex h-full flex-col"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col space-y-2">
              <TabsList variant="default" asPill size="sm">
                <TabsTrigger value="cost" asPill>
                  Cost
                </TabsTrigger>
                <TabsTrigger value="top-costs" asPill>
                  Top Costs
                </TabsTrigger>
              </TabsList>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(totalCost)}
              </p>
            </div>
          </div>

          <div className="flex-grow py-4">
            {/* Cost Tab */}
            <TabsContent value="cost" className="mt-0 h-full">
              {transformedData.costData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Small className="text-muted-foreground">
                    No cost data available
                  </Small>
                </div>
              ) : (
                <ChartContainer
                  config={costChartConfig}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    data={transformedData.costData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(timestamp) =>
                        format(new Date(timestamp), "MMM d")
                      }
                      scale="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={50}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={(value) => formatAxisCurrency(value)}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0)
                          return null;

                        const date = payload[0]?.payload?.dateLabel || "";

                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="mb-2 text-sm font-medium text-foreground">
                              {date}
                            </p>
                            <div className="flex flex-col gap-1">
                              {payload
                                .filter((item) => Number(item.value) > 0)
                                .sort(
                                  (a, b) => Number(b.value) - Number(a.value),
                                )
                                .map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: item.color,
                                        }}
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {String(item.name)}
                                      </span>
                                    </div>
                                    <span className="text-xs font-semibold text-foreground">
                                      {formatCurrency(Number(item.value))}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {transformedData.topPropertiesByCost?.map((prop, index) => (
                      <Line
                        key={prop}
                        type="monotone"
                        dataKey={prop}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={prop}
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              )}
            </TabsContent>

            {/* Top Costs Tab */}
            <TabsContent value="top-costs" className="mt-0 h-full">
              <PropertyTopCosts property={property} timeFilter={timeFilter} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Requests Analytics Card */}
      <div className="flex flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
        <Tabs
          value={selectedRequestsTab}
          onValueChange={setSelectedRequestsTab}
          className="flex h-full flex-col"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col space-y-2">
              <TabsList variant="default" asPill size="sm">
                <TabsTrigger value="requests" asPill>
                  Requests
                </TabsTrigger>
              </TabsList>
              <p className="text-xl font-semibold text-foreground">
                {formatNumber(totalRequests)}
              </p>
            </div>
          </div>

          <div className="flex-grow py-4">
            {/* Requests Tab */}
            <TabsContent value="requests" className="mt-0 h-full">
              {transformedData.requestsData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Small className="text-muted-foreground">
                    No request data available
                  </Small>
                </div>
              ) : (
                <ChartContainer
                  config={requestsChartConfig}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    data={transformedData.requestsData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(timestamp) =>
                        format(new Date(timestamp), "MMM d")
                      }
                      scale="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={50}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={(value) => formatNumber(value)}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0)
                          return null;

                        const date = payload[0]?.payload?.dateLabel || "";

                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="mb-2 text-sm font-medium text-foreground">
                              {date}
                            </p>
                            <div className="flex flex-col gap-1">
                              {payload
                                .filter((item) => Number(item.value) > 0)
                                .sort(
                                  (a, b) => Number(b.value) - Number(a.value),
                                )
                                .map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: item.color,
                                        }}
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {String(item.name)}
                                      </span>
                                    </div>
                                    <span className="text-xs font-semibold text-foreground">
                                      {formatNumber(Number(item.value))}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {transformedData.topPropertiesByRequests?.map(
                      (prop, index) => (
                        <Line
                          key={prop}
                          type="monotone"
                          dataKey={prop}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          name={prop}
                        />
                      ),
                    )}
                  </LineChart>
                </ChartContainer>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
