import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";
import { useGetPropertiesV2 } from "./propertiesV2";
import { $JAWN_API } from "@/lib/clients/jawn";

// Type assertion for FilterNode compatibility with generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JawnFilterNode = any;

export interface Quantiles {
  time: Date;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

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
  const { isLoading: isPropertiesLoading } =
    useGetPropertiesV2(getPropertyFiltersV2);

  const {
    data: quantilesData,
    isLoading,
    refetch,
  } = $JAWN_API.useQuery(
    "post",
    "/v1/metrics/quantiles",
    {
      body: {
        filter: data.filters as JawnFilterNode,
        timeFilter: {
          start: data.timeFilter.start.toISOString(),
          end: data.timeFilter.end.toISOString(),
        },
        dbIncrement: data.dbIncrement,
        timeZoneDifference: data.timeZoneDifference,
        metric: data.metric,
      },
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  // Transform the response to match expected format
  const quantiles = quantilesData?.data
    ? {
        data: quantilesData.data.map((d) => ({
          ...d,
          time: new Date(d.time),
        })),
        error: null,
      }
    : quantilesData?.error
      ? { data: null, error: quantilesData.error }
      : undefined;

  const isQuantilesLoading = isPropertiesLoading || isLoading;

  return { quantiles, isQuantilesLoading, refetch };
};

export { useQuantiles };
