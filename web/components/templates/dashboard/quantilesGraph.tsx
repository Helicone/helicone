import { useState } from "react";
import { useQuantiles } from "../../../services/hooks/quantiles";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingAnimation from "../../shared/loadingAnimation";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getMockQuantiles } from "./mockDashboardData";
import { CHART_COLORS } from "../../../lib/chartColors";

type QuantilesGraphProps = {
  filters: FilterNode;
  timeFilter: {
    start: Date;
    end: Date;
  };
  timeIncrement: TimeIncrement;
};

export const QuantilesGraph = ({
  filters,
  timeFilter,
  timeIncrement,
}: QuantilesGraphProps) => {
  const quantilesMetrics = new Map([
    ["Latency", "latency"],
    ["Prompt tokens", "prompt_tokens"],
    ["Completion tokens", "completion_tokens"],
    ["Total tokens", "total_tokens"],
  ]);

  const [currentMetric, setCurrentMetric] = useState("Latency");
  const org = useOrg();
  const shouldShowMockData = org?.currentOrg?.has_onboarded === false;

  const { quantiles, isQuantilesLoading: quantilesIsLoading } = useQuantiles({
    filters,
    timeFilter,
    dbIncrement: timeIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
    metric: quantilesMetrics.get(currentMetric) ?? "latency",
  });

  const mockQuantiles = shouldShowMockData
    ? getMockQuantiles(quantilesMetrics.get(currentMetric))
    : null;

  function max(arr: number[]) {
    return arr.reduce((p, c) => (p > c ? p : c), 0);
  }

  const quantilesData = shouldShowMockData
    ? mockQuantiles?.data
    : quantiles?.data;
  const maxQuantile = max(
    quantilesData?.map((d) => d.p99).filter((d) => d !== 0) ?? [],
  );

  return (
    <div className="flex h-full flex-col border-b border-r border-slate-200 bg-white p-6 text-foreground dark:border-slate-800">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex w-full flex-col space-y-0.5">
          <p className="text-sm text-muted-foreground">Quantiles</p>
          {currentMetric === "Latency" ? (
            <p className="text-xl font-semibold text-foreground">
              {`Max: ${new Intl.NumberFormat("us").format(
                maxQuantile / 1000,
              )} s`}
            </p>
          ) : (
            <p className="text-xl font-semibold text-foreground">
              {`Max: ${new Intl.NumberFormat("us").format(maxQuantile)} tokens`}
            </p>
          )}
        </div>
        <div>
          {(!quantilesIsLoading || shouldShowMockData) && (
            <Select value={currentMetric} onValueChange={setCurrentMetric}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(quantilesMetrics.entries()).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="w-full pt-4">
        {quantilesIsLoading && !shouldShowMockData ? (
          <div className="flex h-[180px] w-full items-center justify-center bg-muted">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <ChartContainer
            config={{
              P75: {
                label: "P75",
                color: CHART_COLORS.blue,
              },
              P90: {
                label: "P90",
                color: CHART_COLORS.purple,
              },
              P95: {
                label: "P95",
                color: CHART_COLORS.cyan,
              },
              P99: {
                label: "P99",
                color: CHART_COLORS.pink,
              },
            }}
            className="h-[180px] w-full"
          >
            <AreaChart
              data={
                quantilesData?.map((r) => {
                  const time = new Date(r.time);
                  // Convert to seconds if Latency, otherwise use raw values
                  const divisor = currentMetric === "Latency" ? 1000 : 1;
                  return {
                    date: getTimeMap(timeIncrement)(time),
                    P75: r.p75 / divisor,
                    P90: r.p90 / divisor,
                    P95: r.p95 / divisor,
                    P99: r.p99 / divisor,
                  };
                }) ?? []
              }
            >
              <defs>
                <linearGradient id="fillP75" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-P75)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-P75)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillP90" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-P90)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-P90)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillP95" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-P95)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-P95)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillP99" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-P99)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-P99)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={50}
              />
              <YAxis domain={[0, "auto"]} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    valueFormatter={(value) => {
                      const formatted = new Intl.NumberFormat("us").format(
                        Number(value),
                      );
                      return currentMetric === "Latency"
                        ? `${formatted} s`
                        : `${formatted} tokens`;
                    }}
                  />
                }
              />
              <Area
                dataKey="P75"
                type="monotone"
                fill="url(#fillP75)"
                stroke="var(--color-P75)"
                stackId="a"
              />
              <Area
                dataKey="P90"
                type="monotone"
                fill="url(#fillP90)"
                stroke="var(--color-P90)"
                stackId="a"
              />
              <Area
                dataKey="P95"
                type="monotone"
                fill="url(#fillP95)"
                stroke="var(--color-P95)"
                stackId="a"
              />
              <Area
                dataKey="P99"
                type="monotone"
                fill="url(#fillP99)"
                stroke="var(--color-P99)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
};
