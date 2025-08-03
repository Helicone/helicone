import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "@/types/timeFilter";
import { Result } from "@/packages/common/result";
import { CountryData } from "../lib/country";
import { FilterNode } from "@helicone-package/filters/filterDefs";

const useCountries = (
  timeFilter: TimeFilter,
  limit: number,
  userFilters: FilterNode,
) => {
  const {
    data: countries,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["countries", timeFilter, limit, userFilters],
    queryFn: async (query) => {
      const [, timeFilter, limit, userFilters] = query.queryKey;
      return await fetch("/api/country", {
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
      }).then((res) => res.json() as Promise<Result<CountryData[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return { countries, isLoading, refetch };
};

export { useCountries };
