import { TimeFilter } from "@/types/timeFilter";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { $JAWN_API } from "@/lib/clients/jawn";

// Type assertion for FilterNode compatibility with generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JawnFilterNode = any;

export interface CountryData {
  country: string;
  total_requests: number;
}

const useCountries = (
  timeFilter: TimeFilter,
  limit: number,
  userFilters: FilterNode,
) => {
  const { data, isLoading, refetch } = $JAWN_API.useQuery(
    "post",
    "/v1/metrics/country",
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
    },
  );

  return { countries: data, isLoading, refetch };
};

export { useCountries };
