import {
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Dispatch, SetStateAction, useState } from "react";

import { GraphDataState } from "../../../lib/dashboardGraphs";
import { Result } from "../../../lib/result";
import {
  getTimeMap,
  timeGraphConfig,
} from "../../../lib/timeCalculations/constants";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { clsx } from "../../shared/clsx";
import ThemedTabs from "../../shared/themed/themedTabs";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { Loading } from "./dashboardPage";
import LogPanel from "./logPanel";
import { TimeActions } from "./timeActions";

import { RenderLineChart } from "./timeGraph";

interface TimeGraphWHeaderProps {
  data: GraphDataState;

  timeMap: (date: Date) => string;
}

function unwrapDefaultEmpty<T>(data: Loading<Result<T[], string>>): T[] {
  if (data === "loading") {
    return [];
  }
  if (data.error !== null) {
    return [];
  }
  return data.data;
}

const TimeGraphWHeader = (props: TimeGraphWHeaderProps) => {
  const {
    data: { requestsOverTime, costOverTime, errorOverTime },
    timeMap,
  } = props;

  const [mode, setMode] = useState<"requests" | "costs" | "errors">("requests");

  return (
    <div className="flex flex-col space-y-4 pt-4">
      <ThemedTabs
        options={[
          {
            icon: TableCellsIcon,
            label: "Requests",
          },
          {
            icon: CurrencyDollarIcon,
            label: "Costs",
          },
          {
            icon: ExclamationCircleIcon,
            label: "Errors",
          },
        ]}
        onOptionSelect={(option) => {
          setMode(option.toLowerCase() as "requests" | "costs" | "errors");
        }}
      />
      <div
        className={clsx(requestsOverTime === "loading" ? "animate-pulse" : "")}
      >
        {mode === "requests" && (
          <div className="h-96 bg-white border border-gray-300 rounded-lg py-4 pr-12">
            <h3 className="text-md font-semibold text-gray-900 text-center">
              Requests
            </h3>
            <RenderLineChart
              data={unwrapDefaultEmpty(requestsOverTime).map((r) => ({
                ...r,
                value: r.count,
              }))}
              timeMap={timeMap}
              valueFormatter={(v) => [v.toString(), "requests"]}
            />
          </div>
        )}
        {mode === "costs" && (
          <div className="h-96 bg-white border border-gray-300 rounded-lg py-4 pr-12">
            <h3 className="text-md font-semibold text-gray-900 text-center">
              Costs (USD)
            </h3>
            <RenderLineChart
              data={unwrapDefaultEmpty(costOverTime).map((r) => ({
                ...r,
                value: r.cost,
              }))}
              timeMap={timeMap}
              valueFormatter={(v) => {
                return [
                  `$${(typeof v === "number"
                    ? v.toFixed(v % 1 !== 0 ? 1 : 0)
                    : v
                  ).toString()}`,
                  "cost",
                ];
              }}
            />
          </div>
        )}
        {mode === "errors" && (
          <div className="h-96 bg-white border border-gray-300 rounded-lg py-4 pr-12">
            <h3 className="text-md font-semibold text-gray-900 text-center">
              Errors
            </h3>
            <RenderLineChart
              data={unwrapDefaultEmpty(errorOverTime).map((r) => ({
                ...r,
                value: r.count,
              }))}
              timeMap={timeMap}
              valueFormatter={(v) => [v.toString(), "errors"]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
