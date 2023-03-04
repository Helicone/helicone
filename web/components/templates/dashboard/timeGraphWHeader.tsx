import { Dispatch, SetStateAction } from "react";

import { GraphDataState } from "../../../lib/dashboardGraphs";
import { Result } from "../../../lib/result";
import {
  getTimeMap,
  timeGraphConfig,
} from "../../../lib/timeCalculations/constants";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { clsx } from "../../shared/clsx";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import { Loading } from "./dashboardPage";
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

  return (
    <div className="h-full w-full">
      <div
        className={clsx(
          "grid grid-cols-1 lg:grid-cols-2 w-full h-full mt-8 gap-8",
          requestsOverTime === "loading" ? "animate-pulse" : ""
        )}
      >
        {/* Requests over time */}
        <div className="col-span-1 h-80 border border-gray-300 shadow-sm rounded-lg pl-0 pr-8 pt-4 pb-8 space-y-1 bg-white">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            OpenAI Requests over time
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

        {/* Costs over time */}
        <div className="col-span-1 h-80 border border-gray-300 bg-white shadow-sm rounded-lg pl-0 pr-8 pt-4 pb-8 space-y-1">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            Costs over time (USD)
          </h3>
          <RenderLineChart
            data={unwrapDefaultEmpty(costOverTime).map((r) => ({
              ...r,
              value: r.cost,
            }))}
            timeMap={timeMap}
            valueFormatter={(v) => [`$${v.toString()}`, "cost"]}
          />
        </div>

        {/* Errors */}
        <div className="col-span-1 h-80 border border-gray-300 bg-white shadow-sm rounded-lg pl-0 pr-8 pt-4 pb-8 space-y-1">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            Errors over time
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
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
