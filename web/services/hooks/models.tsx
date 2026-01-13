import { TimeFilter } from "@/types/timeFilter";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { $JAWN_API } from "@/lib/clients/jawn";

// Type assertion for FilterNode compatibility with generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JawnFilterNode = any;

export interface ModelMetric {
  model: string;
  total_requests: number;
  total_completion_tokens: number;
  total_prompt_token: number;
  total_tokens: number;
  cost: number;
}

const useModels = (
  timeFilter: TimeFilter,
  limit: number,
  userFilters?: FilterNode
) => {
  const { data, isLoading } = $JAWN_API.useQuery(
    "post",
    "/v1/metrics/models",
    {
      body: {
        filter: (userFilters ?? {}) as JawnFilterNode,
        offset: 0,
        limit,
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return { models: data, isLoading };
};

export { useModels };
