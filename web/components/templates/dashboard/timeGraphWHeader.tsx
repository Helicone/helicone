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
import { TimeActions } from "./timeActions";

import { RenderLineChart } from "./timeGraph";

interface TimeGraphWHeaderProps {
  data: TimeData[];
  setFilter: Dispatch<SetStateAction<FilterNode>>;
}

const TimeGraphWHeader = (props: TimeGraphWHeaderProps) => {
  const { data, setFilter } = props;
  const [interval, setInterval] = useState<TimeInterval>("1m");

  useEffect(() => {
    setFilter((prev) => {
      const newFilter: FilterLeaf = {
        request: {
          created_at: {
            gte: timeGraphConfig[interval].start.toISOString(),
            lte: timeGraphConfig[interval].end.toISOString(),
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
  }, [interval, setFilter]);

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
            }}
          />
        </div>
      </div>
      <div className="w-full h-72 mt-8">
        <RenderLineChart
          data={data}
          timeMap={timeGraphConfig[interval].timeMap}
        />
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
