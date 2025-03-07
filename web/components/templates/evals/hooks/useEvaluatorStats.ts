import { useJawnClient } from "@/lib/clients/jawnHook";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useQuery } from "@tanstack/react-query";

export interface EvaluatorStats {
  averageScore: number;
  totalUses: number | string;
  recentTrend: "up" | "down" | "stable";
  scoreDistribution: Array<{
    range: string;
    count: number | string;
  }>;
  timeSeriesData: Array<{
    date: string;
    value: number;
  }>;
}

// Default stats used when there's no data or an error
export const DEFAULT_STATS: EvaluatorStats = {
  averageScore: 0,
  totalUses: 0,
  recentTrend: "stable" as const,
  scoreDistribution: [],
  timeSeriesData: [],
};

export const useEvaluatorStats = (evaluatorId: string) => {
  const jawn = useJawnClient();
  const org = useOrg();

  return useQuery({
    queryKey: ["evaluatorStats", evaluatorId, org?.currentOrg?.id],
    queryFn: async () => {
      if (!evaluatorId) {
        return DEFAULT_STATS;
      }

      try {
        const response = await jawn.GET("/v1/evaluator/{evaluatorId}/stats", {
          params: {
            path: {
              evaluatorId,
            },
          },
        });

        // Cast the response to a more flexible type to check its properties
        const responseData = response as any;

        // Check for error response
        if (responseData?.error) {
          console.warn(
            `API error for evaluator ${evaluatorId}: ${responseData.error}`
          );
          return DEFAULT_STATS;
        }

        // Check if data is missing or null
        if (!responseData?.data?.data) {
          console.warn(`No stats data returned for evaluator ${evaluatorId}`);
          return DEFAULT_STATS;
        }

        // Process and normalize the data to ensure it matches expected types
        const rawData = responseData.data.data;
        const processedData: EvaluatorStats = {
          averageScore: Number(rawData.averageScore) || 0,
          totalUses: rawData.totalUses, // Keep as string or number
          recentTrend: rawData.recentTrend || "stable",
          scoreDistribution: Array.isArray(rawData.scoreDistribution)
            ? rawData.scoreDistribution
            : [],
          timeSeriesData: Array.isArray(rawData.timeSeriesData)
            ? rawData.timeSeriesData.map(
                (item: { date: string; value: number | string }) => ({
                  date: item.date,
                  value: Number(item.value) || 0,
                })
              )
            : [],
        };

        return processedData;
      } catch (error) {
        console.error(
          `Exception fetching stats for evaluator ${evaluatorId}:`,
          error
        );
        return DEFAULT_STATS;
      }
    },
    // Don't refetch on window focus since stats don't change that often
    refetchOnWindowFocus: false,
    // Enable the query only if evaluatorId is provided
    enabled: !!evaluatorId && !!org?.currentOrg?.id,
    // Use static default data while loading
    placeholderData: DEFAULT_STATS,
    // Don't retry too many times to avoid console spam
    retry: 1,
    // Add some staleTime to reduce unnecessary requests
    staleTime: 60 * 1000, // 1 minute
  });
};
