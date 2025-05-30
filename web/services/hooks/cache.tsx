import { TimeFilter } from "@/services/lib/filters/filterDefs";
import { useQuery } from "@tanstack/react-query";
import { Result, resultMap } from "@/packages/common/result";
import { TopCachedRequest } from "@/lib/api/cache/stats";

export const useGetCacheCount = (
  timeFilter: TimeFilter,
) => {
  return useQuery({
    queryKey: [
      "cacheCount",
      timeFilter
    ],
    queryFn: async (query) => {
      const [_, timeFilter] = query.queryKey as [string, TimeFilter];
      return await fetch("/api/cache/total", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeFilter: {
            start: timeFilter.start,
            end: timeFilter.end
          }
        }),
      }).then((res) => res.json() as Promise<Result<number, string>>);
    },
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000,
  })
}

export const useGetCacheTotalSavings = (
  timeFilter: TimeFilter,
) => {
  return useQuery({
    queryKey: [
      "totalSavings",
      timeFilter
    ],
    queryFn: async (query) => {
      const [_, timeFilter] = query.queryKey as [string, TimeFilter];
      return await fetch("/api/cache/total_savings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeFilter: {
            start: timeFilter.start,
            end: timeFilter.end
          }
        }),
      }).then((res) => res.json() as Promise<Result<number, string>>);
    },
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000,
  })
}

export const useGetCacheTimeSaved = (
  timeFilter: TimeFilter,
) => {
  return useQuery({
    queryKey: [
      "timeSaved",
      timeFilter
    ],
    queryFn: async (query) => {
      const [_, timeFilter] = query.queryKey as [string, TimeFilter];
      return await fetch("/api/cache/time_saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeFilter: {
            start: timeFilter.start,
            end: timeFilter.end
          }
        }),
      }).then((res) => res.json() as Promise<Result<number, string>>);
    },
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000,
  })
}

export const useGetCacheTopRequests = (
  timeFilter: TimeFilter,
) => {
  return useQuery({
    queryKey: [
      "topRequests",
      timeFilter
    ],
    queryFn: async (query) => {
      const [_, timeFilter] = query.queryKey as [string, TimeFilter];
      return await fetch("/api/cache/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeFilter: {
            start: timeFilter.start,
            end: timeFilter.end
          }
        }),
      }).then((res) => res.json() as Promise<Result<TopCachedRequest[], string>>);
    },
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000,
  })
}