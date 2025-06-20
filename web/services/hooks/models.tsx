import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "@/types/timeFilter";
import { Result } from "@/packages/common/result";
import { ModelMetric } from "../../lib/api/models/models";
import { FilterNode } from "@helicone-package/filters/filterDefs";

const useModels = (
  timeFilter: TimeFilter,
  limit: number,
  userFilters?: FilterNode
) => {
  const {
    data: models,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["modelMetrics", timeFilter, userFilters],
    queryFn: async (query) => {
      return await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: userFilters ?? "all",
          offset: 0,
          limit,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return { models, isLoading, isRefetching };
};

const useModelCount = (timeFilter: TimeFilter, userFilters?: FilterNode) => {
  const {
    data: count,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["modelCount", timeFilter, userFilters],
    queryFn: async () => {
      return await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: userFilters ?? "all",
          count: true,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<number, string>>);
    },
    refetchOnWindowFocus: false,
  });

  return { count, isLoading, isRefetching };
};

export { useModels, useModelCount };
