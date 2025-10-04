import { useState } from "react";
import { useQuantiles } from "../../../services/hooks/quantiles";
import { Card, LineChart } from "@tremor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getMockQuantiles } from "./mockDashboardData";
import DashboardChartTooltipContent from "./DashboardChartTooltipContent";

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
    <Card className="rounded-lg border border-slate-200 bg-white text-slate-950 !shadow-sm ring-0 dark:border-slate-800 dark:bg-black dark:text-slate-50">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex w-full flex-col space-y-0.5">
          <p className="text-sm text-gray-500">Quantiles</p>
          {currentMetric === "Latency" ? (
            <p className="text-xl font-semibold text-black dark:text-white">
              {`Max: ${new Intl.NumberFormat("us").format(
                maxQuantile / 1000,
              )} s`}
            </p>
          ) : (
            <p className="text-xl font-semibold text-black dark:text-white">
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
                {Array.from(quantilesMetrics.entries()).map(([key, _value]) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div
        className={clsx("p-2", "w-full")}
        style={{
          height: "212px",
        }}
      >
        {quantilesIsLoading && !shouldShowMockData ? (
          <div className="h-full w-full rounded-md bg-gray-200 pt-4 dark:bg-gray-800">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <LineChart
            customTooltip={DashboardChartTooltipContent}
            className="h-[14rem]"
            data={
              quantilesData?.map((r) => {
                const time = new Date(r.time);
                // return all of the values on a 0-100 scale where 0 is the min value and 100 is the max value of
                return {
                  date: getTimeMap(timeIncrement)(time),
                  P75: r.p75,
                  P90: r.p90,
                  P95: r.p95,
                  P99: r.p99,
                };
              }) ?? []
            }
            index="date"
            categories={["P75", "P90", "P95", "P99"]}
            colors={[
              "yellow",
              "red",
              "green",
              "blue",
              "orange",
              "indigo",
              "orange",
              "pink",
            ]}
            showYAxis={false}
            curveType="monotone"
            valueFormatter={(number: number | bigint) => {
              if (currentMetric === "Latency") {
                return `${new Intl.NumberFormat("us").format(
                  Number(number) / 1000,
                )} s`;
              } else {
                return `${new Intl.NumberFormat("us").format(number)} tokens`;
              }
            }}
          />
        )}
      </div>
    </Card>
  );
};
