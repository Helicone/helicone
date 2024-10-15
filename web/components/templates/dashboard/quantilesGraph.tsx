import { useState } from "react";
import { useQuantiles } from "../../../services/hooks/quantiles";
import { Card, LineChart, Select, SelectItem } from "@tremor/react";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

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
    <Card className="border border-slate-200 bg-white text-slate-950 !shadow-sm dark:border-slate-800 dark:bg-black dark:text-slate-50 rounded-lg ring-0">
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-col space-y-0.5 w-full">
          <p className="text-gray-500 text-sm">Quantiles</p>
          {currentMetric === "Latency" ? (
            <p className="text-black dark:text-white text-xl font-semibold">
              {`Max: ${new Intl.NumberFormat("us").format(
                maxQuantile / 1000
              )} s`}
            </p>
          ) : (
            <p className="text-black dark:text-white text-xl font-semibold">
              {`Max: ${new Intl.NumberFormat("us").format(maxQuantile)} tokens`}
            </p>
          )}
        </div>
        <div>
          {!quantilesIsLoading && (
            <Select
              placeholder="Select property"
              value={currentMetric}
              onValueChange={setCurrentMetric}
              className="border border-gray-400 rounded-lg w-fit"
            >
              {Array.from(quantilesMetrics.entries()).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
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
        {quantilesIsLoading ? (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-800 rounded-md pt-4">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <LineChart
            className="h-[14rem]"
            data={
              quantiles?.data?.map((r) => {
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
                  Number(number) / 1000
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
