import { Dispatch, SetStateAction } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { GraphDataState } from "../../../lib/dashboardGraphs";
import { Result } from "../../../lib/result";
import { timeGraphConfig } from "../../../lib/timeCalculations/constants";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { clsx } from "../../shared/clsx";
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Requests over time
        </h3>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-row gap-4">
          <TimeActions
            setFilter={setFilter}
            interval={interval}
            setInterval={setInterval}
            onIntervalChange={(newInterval) => {
              setInterval(newInterval);
              setFilter((prev) => {
                const newFilter: FilterLeaf = {
                  request: {
                    created_at: {
                      gte: timeGraphConfig[newInterval].start.toISOString(),
                      lte: timeGraphConfig[newInterval].end.toISOString(),
                    },
                  },
                };
                if (prev === "all") {
                  return newFilter;
                }
                if ("left" in prev) {
                  throw new Error("Not implemented");
                }
                return {
                  ...prev,
                  ...newFilter,
                };
              });
            }}
          />
        </div>
      </div>
      <div
        className={clsx(
          "flex flex-col w-full h-full mt-8",
          requestsOverTime === "loading" ? "animate-pulse" : ""
        )}
      >
        {/* Requests over time */}
        <RenderLineChart
          data={unwrapDefaultEmpty(requestsOverTime).map((r) => ({
            ...r,
            value: r.count,
          }))}
          timeMap={timeGraphConfig[interval].timeMap}
        />

        {/* Costs over time */}
        <RenderLineChart
          data={unwrapDefaultEmpty(costOverTime).map((r) => ({
            ...r,
            value: r.cost,
          }))}
          timeMap={timeGraphConfig[interval].timeMap}
        />

        {/* Errors */}
        <RenderLineChart
          data={unwrapDefaultEmpty(errorOverTime).map((r) => ({
            ...r,
            value: r.count,
          }))}
          timeMap={timeGraphConfig[interval].timeMap}
        />
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
