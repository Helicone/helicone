import { useQuery } from "@tanstack/react-query";
import { Result } from "../../lib/result";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { Quantiles } from "../../lib/api/metrics/quantilesCalc";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../lib/filters/filterDefs";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../lib/filters/frontendFilterDefs";
import { UIFilterRow } from "../../components/shared/themed/themedAdvancedFilters";

const useQuantiles = (data: {
  uiFilters: UIFilterRow[];
  timeFilter: {
    start: Date;
    end: Date;
  };
  dbIncrement: TimeIncrement;
  timeZoneDifference: number;
  metric: string;
}) => {
  const {
    data: quantiles,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "quantiles",
      data.timeFilter,
      data.metric,
      data.uiFilters,
      data.dbIncrement,
      data.timeZoneDifference,
    ],
    queryFn: async (query) => {
      console.log(query);
      const timeFilter = query.queryKey[1];
      const metric = query.queryKey[2];
      const uiFilters = query.queryKey[3] as UIFilterRow[];
      const dbIncrement = query.queryKey[4];
      const timeZoneDifference = query.queryKey[5];

      const filterMap = DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[];

      const userFilters = filterUIToFilterLeafs(filterMap, uiFilters);

      return await fetch("/api/metrics/quantiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            timeFilter: timeFilter,
            userFilter: filterListToTree(userFilters, "and"),
            dbIncrement: dbIncrement,
            timeZoneDifference: timeZoneDifference,
            metric: metric,
          },
        }),
      }).then((res) => res.json() as Promise<Result<Quantiles[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return { quantiles, isLoading, refetch };
};

export { useQuantiles };
