import { Dispatch, SetStateAction } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { GraphDataState } from "../../../lib/dashboardGraphs";
import { Result } from "../../../lib/result";
import { timeGraphConfig } from "../../../lib/timeCalculations/constants";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { clsx } from "../../shared/clsx";
import ThemedTimeFilter from "../../shared/themedTimeFilter";
import { Loading } from "./dashboardPage";
import { TimeActions } from "./timeActions";

import { RenderLineChart } from "./timeGraph";

interface TimeGraphWHeaderProps {
  data: GraphDataState;
  setFilter: Dispatch<SetStateAction<FilterNode>>;
  interval: TimeInterval;
  setInterval: Dispatch<SetStateAction<TimeInterval>>;
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
    setFilter,
    interval,
    setInterval,
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
            Requests over time
          </h3>
          <RenderLineChart
            data={unwrapDefaultEmpty(requestsOverTime).map((r) => ({
              ...r,
              value: r.count,
            }))}
            timeMap={timeGraphConfig[interval].timeMap}
          />
        </div>

        {/* Costs over time */}
        <div className="col-span-1 h-80 border border-gray-300 bg-white shadow-sm rounded-lg pl-0 pr-8 pt-4 pb-8 space-y-1">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            Costs over time
          </h3>
          <RenderLineChart
            data={unwrapDefaultEmpty(costOverTime).map((r) => ({
              ...r,
              value: r.cost,
            }))}
            timeMap={timeGraphConfig[interval].timeMap}
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
            timeMap={timeGraphConfig[interval].timeMap}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
