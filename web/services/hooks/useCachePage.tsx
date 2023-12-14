import { useQuery } from "@tanstack/react-query";
import { Result, resultMap } from "../../lib/result";
import {
  getTopModelUsage,
  getTopRequests,
  getTopUserUsage,
} from "../../lib/api/cache/stats";
import { getModelUsageOverTimeBackFill } from "../../pages/api/cache/over_time";

/**
 * Custom hook that retrieves cache page metrics.
 * @returns An object containing the total cached, total savings, and total time saved.
 */
export function useCachePageMetrics() {
  const totalCached = useQuery({
    queryKey: ["totalCached"],
    queryFn: async () => {
      const data = fetch("/api/cache/total").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });

  const totalSavings = useQuery({
    queryKey: ["totalSavings"],
    queryFn: async () => {
      const data = fetch("/api/cache/total_savings").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });

  const totalTimeSaved = useQuery({
    queryKey: ["totalTimeSaved"],
    queryFn: async () => {
      const data = fetch("/api/cache/time_saved").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });
  return {
    totalCached,
    totalSavings,
    totalTimeSaved,
  };
}

/**
 * Custom hook to fetch and cache top metrics data.
 * @returns An object containing the top models and top users data.
 */
export function useCachePageTopMetrics() {
  const topModels = useQuery({
    queryKey: ["topModels"],
    queryFn: async () => {
      const data = fetch("/api/cache/top_models").then(
        (res) => res.json() as ReturnType<typeof getTopModelUsage>
      );
      return data;
    },
  });

  const topUsers = useQuery({
    queryKey: ["topUsers"],
    queryFn: async () => {
      const data = fetch("/api/cache/top_users").then(
        (res) => res.json() as ReturnType<typeof getTopUserUsage>
      );
      return data;
    },
  });

  return {
    topModels,
    topUsers,
  };
}

/**
 * Custom hook for caching data over time.
 * @returns An object containing the `overTime` query result.
 */
export function useCacheOvertime() {
  const overTime = useQuery({
    queryKey: ["overTime"],
    queryFn: async () => {
      const data = fetch("/api/cache/over_time").then(
        (res) => res.json() as ReturnType<typeof getModelUsageOverTimeBackFill>
      );
      return data;
    },
  });

  overTime.data &&
    resultMap(overTime.data, (result) => {
      const allModels = new Set<string>();
      result.forEach((entry) => {
        Object.keys(entry).forEach((model) => {
          allModels.add(model);
        });
      });
      allModels.delete("time");
      const x = result.map((entry) => {
        allModels.forEach((model) => {
          if (!entry[model]) {
            entry[model] = 0;
          }
        });
        return entry;
      });
    });

  return {
    overTime,
  };
}

/**
 * Custom hook for caching top requests.
 * @returns An object containing the topRequests query.
 */
export function useCachePageTopRequests() {
  const topRequests = useQuery({
    queryKey: ["topRequests"],
    queryFn: async () => {
      const data = fetch("/api/cache/requests").then(
        (res) => res.json() as ReturnType<typeof getTopRequests>
      );
      return data;
    },
  });
  return {
    topRequests,
  };
}
