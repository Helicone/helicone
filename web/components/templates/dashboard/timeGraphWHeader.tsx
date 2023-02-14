import { SupabaseClient } from "@supabase/supabase-js";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { Result } from "../../../lib/result";
import { timeGraphConfig } from "../../../lib/timeCalculations/constants";
import {
  TimeData,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import { Loading } from "./dashboardPage";
import { TimeActions } from "./timeActions";

import { RenderLineChart } from "./timeGraph";

interface TimeGraphWHeaderProps {
  data: Loading<Result<TimeData[], string>>;
  setFilter: Dispatch<SetStateAction<FilterNode>>;
  interval: TimeInterval;
  setInterval: Dispatch<SetStateAction<TimeInterval>>;
}

const TimeGraphWHeader = (props: TimeGraphWHeaderProps) => {
  const { data: timeData, setFilter, interval, setInterval } = props;
  const { setNotification } = useNotification();
  if (timeData !== "loading" && timeData.error !== null) {
    setNotification(timeData.error, "error");
  }

  const data =
    timeData === "loading" || timeData.error !== null ? [] : timeData.data;

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
          "w-full h-72 mt-8",
          timeData === "loading" ? "animate-pulse" : ""
        )}
      >
        <RenderLineChart
          data={data}
          timeMap={timeGraphConfig[interval].timeMap}
        />
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
