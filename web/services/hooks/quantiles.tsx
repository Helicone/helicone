import { useQuery } from "@tanstack/react-query";
import { Result } from "@/packages/common/result";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { Quantiles } from "../../lib/api/metrics/quantilesCalc";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";
import { useGetPropertiesV2 } from "./propertiesV2";

const useQuantiles = (data: {
  filters: FilterNode;
  timeFilter: {
    start: Date;
    end: Date;
  };
  dbIncrement: TimeIncrement;
  timeZoneDifference: number;
  metric: string;
}) => {
  const { isLoading: isPropertiesLoading, propertyFilters } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const {
    data: quantiles,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "quantiles",
      data.timeFilter,
      data.metric,
      data.filters,
      data.dbIncrement,
      data.timeZoneDifference,
    ],
    queryFn: async (query) => {
      const timeFilter = query.queryKey[1];
      const metric = query.queryKey[2];
      const uiFilters = query.queryKey[3] as FilterNode;
      const dbIncrement = query.queryKey[4];
      const timeZoneDifference = query.queryKey[5];

      return await fetch("/api/metrics/quantiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            timeFilter: timeFilter,
            userFilter: uiFilters,
            dbIncrement: dbIncrement,
            timeZoneDifference: timeZoneDifference,
            metric: metric,
          },
        }),
      }).then((res) => res.json() as Promise<Result<Quantiles[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  const isQuantilesLoading = isPropertiesLoading || isLoading;

  return { quantiles, isQuantilesLoading, refetch };
};

export { useQuantiles };
