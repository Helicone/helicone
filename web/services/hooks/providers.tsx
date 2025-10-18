import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "@/types/timeFilter";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useJawnClient } from "@/lib/clients/jawnHook";

export interface ProviderMetric {
  provider: string;
  total_requests: number;
}

const useProviders = (
  timeFilter: TimeFilter,
  limit: number,
  userFilters?: FilterNode,
) => {
  const jawn = useJawnClient();

  const { data: providers, isLoading } = useQuery({
    queryKey: ["providerMetrics", timeFilter, userFilters, limit],
    queryFn: async () => {
      return jawn.POST("/v1/providers", {
        body: {
          filter: (userFilters ?? {}) as any,
          offset: 0,
          limit,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return { providers, isLoading };
};

export { useProviders };
