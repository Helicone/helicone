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
import { RenderBarChart } from "./barChart";
import { Loading } from "./dashboardPage";
import LogPanel from "./logPanel";
import { TimeActions } from "./timeActions";

interface TimeGraphWHeaderProps {
  data: GraphDataState;
  timeMap: (date: Date) => string;
  mode: "requests" | "costs";
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
    data: { requestsOverTime, costOverTime },
    timeMap,
    mode,
  } = props;

  return (
    <div className="flex flex-col space-y-4">
      <div
        className={clsx(requestsOverTime === "loading" ? "animate-pulse" : "")}
      >
        {mode === "requests" && (
          <div className="flex flex-col space-y-4 py-6">
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Requests
            </h3>
            <div className="h-72">
              <RenderBarChart
                data={unwrapDefaultEmpty(requestsOverTime).map((r) => ({
                  ...r,
                  value: r.count,
                }))}
                timeMap={timeMap}
                valueLabel="requests"
              />
            </div>
          </div>
        )}
        {mode === "costs" && (
          <div className="flex flex-col space-y-4 py-6">
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Costs
            </h3>
            <div className="h-72">
              <RenderBarChart
                data={unwrapDefaultEmpty(costOverTime).map((r) => ({
                  ...r,
                  value: r.cost,
                }))}
                timeMap={timeMap}
                valueLabel="costs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
