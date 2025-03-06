import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";

export interface ScoreKey {
  score: string;
  count?: number;
}

export function useScoreKeys() {
  const jawn = useJawnClient();

  return useQuery({
    queryKey: ["scores"],
    queryFn: async () => {
      try {
        const response = await jawn.POST("/v1/score/query", {
          body: {},
        });

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        return response.data?.data as ScoreKey[];
      } catch (error) {
        console.error("Error fetching score keys:", error);
        return [] as ScoreKey[];
      }
    },
    refetchOnWindowFocus: false,
  });
}
