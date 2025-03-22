import { FilterNode } from "@/services/lib/filters/filterDefs";
import { TimeFilter } from "@/types/timeFilter";
import { TimeInterval } from "@/lib/timeCalculations/time";
import { useCallback, useMemo } from "react";
import useSearchParams from "@/components/shared/utils/useSearchParams";

function getTimeIntervalAgo(interval: TimeInterval): Date {
  const now = new Date();
  const utcNow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );

  switch (interval) {
    case "3m":
      return new Date(utcNow - 3 * 30 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(utcNow - 30 * 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(utcNow - 7 * 24 * 60 * 60 * 1000);
    case "24h":
      return new Date(utcNow - 24 * 60 * 60 * 1000);
    case "1h":
      return new Date(utcNow - 60 * 60 * 1000);
    case "all":
      return new Date(0);
    default:
      return new Date(utcNow - 24 * 60 * 60 * 1000); // Default to 24h
  }
}

export function useTimeFilterQuery() {
  const searchParams = useSearchParams();

  const getTimeFilterNode = useCallback((): FilterNode => {
    const currentTimeFilter = searchParams.get("t");
    const tableName = "request_response_rmt";
    const createdAtColumn = "request_created_at";

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const [_, start, end] = currentTimeFilter.split("_");

      const filter: FilterNode = {
        left: {
          [tableName]: {
            [createdAtColumn]: {
              gte: new Date(start),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            [createdAtColumn]: {
              lte: new Date(end),
            },
          },
        },
      };
      return filter;
    } else {
      const timeIntervalDate = getTimeIntervalAgo(
        (currentTimeFilter as TimeInterval) || "1m"
      );
      return {
        [tableName]: {
          [createdAtColumn]: {
            gte: new Date(timeIntervalDate),
          },
        },
      };
    }
  }, [searchParams]);

  const getTimeFilter = useCallback((): TimeFilter => {
    const currentTimeFilter = searchParams.get("t");
    let range: TimeFilter;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("1m");
      // Use a stable end date unless explicitly provided in custom range
      const end = currentTimeFilter.split("_")[2] 
        ? new Date(currentTimeFilter.split("_")[2])
        : new Date();
      range = {
        start,
        end,
      };
    } else {
      // Create a stable end date that doesn't change every second
      const now = new Date();
      // Round to the nearest minute to prevent second-by-second updates
      const stableEndDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        0
      );
      
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "1m"),
        end: stableEndDate,
      };
    }
    return range;
  }, [searchParams]);

  const onTimeSelectHandler = useCallback((key: string, value: string) => {
    const tableName = "request_response_rmt";
    const createdAtColumn = "request_created_at";
    
    if (key === "custom") {
      const [start, end] = value.split("_");
      // Set the URL parameter
      searchParams.set("t", `custom_${start}_${end}`);
      
      const filter: FilterNode = {
        left: {
          [tableName]: {
            [createdAtColumn]: {
              gte: new Date(start),
            },
          },
        },
        operator: "and",
        right: {
          [tableName]: {
            [createdAtColumn]: {
              lte: new Date(end),
            },
          },
        },
      };
      return filter;
    } else {
      // Set the URL parameter
      searchParams.set("t", key);
      
      return {
        [tableName]: {
          [createdAtColumn]: {
            gte: new Date(getTimeIntervalAgo(key as TimeInterval)).toISOString(),
          },
        },
      };
    }
  }, [searchParams]);

  const timeFilter = useMemo(() => getTimeFilter(), [getTimeFilter]);
  const timeFilterNode = useMemo(() => getTimeFilterNode(), [getTimeFilterNode]);

  return {
    timeFilter,
    timeFilterNode,
    getTimeFilter,
    getTimeFilterNode,
    onTimeSelectHandler,
  };
}