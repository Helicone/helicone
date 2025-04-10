import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { PromptVersion } from "./PromptVersion";
import ScoresGraph from "./ScoresGraph";

const ScoresGraphContainer = ({
  experimentId,
  promptVersions,
}: {
  promptVersions: PromptVersion[];
  experimentId: string;
}) => {
  const { fetchExperimentHypothesisScores } = useExperimentScores(experimentId);
  const queryClient = useQueryClient();

  const { data: scores, isLoading } = useQuery({
    queryKey: ["experimentScores", experimentId],
    queryFn: async () => {
      const scoresData: Record<string, any> = {};

      // Query for scores for each prompt version
      const results = await Promise.all(
        promptVersions.map(async (pv) => {
          if (pv.id) {
            return {
              id: pv.id,
              data: await fetchExperimentHypothesisScores(pv.id),
            };
          }
          return null;
        })
      );

      // Process results after Promise.all completes
      results.forEach((result) => {
        if (result) {
          scoresData[result.id] = result.data;
        }
      });

      return scoresData;
    },
    // Add these options to prevent cancellation
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });

  // Handle the data setting when scores change
  useEffect(() => {
    if (scores) {
      Object.entries(scores).forEach(([promptVersionId, score]) => {
        queryClient.setQueryData(
          ["experimentScores", experimentId, promptVersionId],
          score ?? ""
        );
      });
    }
  }, [scores, experimentId, queryClient]);

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <ScoresGraph
      promptVersions={promptVersions}
      experimentId={experimentId}
      scores={
        scores as Record<
          string,
          {
            data: Record<string, { value: any; valueType: string }>;

            error: string | null;
          }
        >
      }
    />
  );
};

export default ScoresGraphContainer;
