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
    queryKey: ["providerMetrics", timeFilter, userFilters],
    queryFn: async () => {
      return jawn.GET("/v1/providers");
    },
    refetchOnWindowFocus: false,
  });

  return { providers, isLoading };
};

export { useProviders };
