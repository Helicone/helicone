import { useQuery } from "@tanstack/react-query";
import { Result } from "../../lib/result";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { Quantiles } from "../../lib/api/metrics/quantilesCalc";

const useQuantiles = (data: {
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
    queryKey: ["quantiles", data.timeFilter, data.metric],
    queryFn: async (query) => {
      return await fetch("/api/metrics/quantiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: data,
        }),
      }).then((res) => res.json() as Promise<Result<Quantiles[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return { quantiles, isLoading, refetch };
};

export { useQuantiles };
