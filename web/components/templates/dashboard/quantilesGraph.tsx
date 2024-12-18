import { useState } from "react";
import { useQuantiles } from "../../../services/hooks/quantiles";
import { LineChart } from "@tremor/react";
import { Card, CardContent } from "@/components/ui/card";
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
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { cn } from "@/lib/utils";

type QuantilesGraphProps = {
  uiFilters: FilterNode;
  timeFilter: {
    start: Date;
    end: Date;
  };
  timeIncrement: TimeIncrement;
};

export const QuantilesGraph = ({
  uiFilters,
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

  const { quantiles, isQuantilesLoading: quantilesIsLoading } = useQuantiles({
    uiFilters,
    timeFilter,
    dbIncrement: timeIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
    metric: quantilesMetrics.get(currentMetric) ?? "latency",
  });

  function max(arr: number[]) {
    return arr.reduce((p, c) => (p > c ? p : c), 0);
  }

  const maxQuantile = max(
    quantiles?.data?.map((d) => d.p99).filter((d) => d !== 0) ?? []
  );

  return (
    <Card className="h-full overflow-y-auto">
      <CardContent className="pt-6">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col space-y-0.5">
            <p className="text-slate-500 text-sm">Quantiles</p>
            <p className="text-black dark:text-white text-xl font-semibold">
              {currentMetric === "Latency"
                ? `Max: ${new Intl.NumberFormat("us").format(
                    maxQuantile / 1000
                  )} s`
                : `Max: ${new Intl.NumberFormat("us").format(
                    maxQuantile
                  )} tokens`}
            </p>
          </div>
          <div>
            {!quantilesIsLoading && (
              <Select value={currentMetric} onValueChange={setCurrentMetric}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(quantilesMetrics.entries()).map(([key]) => (
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
          className={cn("p-2", "w-full")}
          style={{
            height: "212px",
          }}
        >
          {quantilesIsLoading ? (
            <div className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-md pt-4">
              <LoadingAnimation height={175} width={175} />
            </div>
          ) : (
            <LineChart
              className="h-full w-full"
              data={
                quantiles?.data?.map((r) => {
                  const time = new Date(r.time);
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
                    Number(number) / 1000
                  )} s`;
                } else {
                  return `${new Intl.NumberFormat("us").format(number)} tokens`;
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
