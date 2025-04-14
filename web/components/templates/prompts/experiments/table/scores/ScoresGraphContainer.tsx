import { useQuery, useQueryClient } from "@tanstack/react-query";
import ScoresGraph from "./ScoresGraph";
import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { useEffect } from "react";
import { PromptVersion } from "./PromptVersion";
import { useOrg } from "@/components/layout/org/organizationContext";

const ScoresGraphContainer = ({
  experimentId,
  promptVersions,
}: {
  promptVersions: PromptVersion[];
  experimentId: string;
}) => {
  const { fetchExperimentHypothesisScores } = useExperimentScores(experimentId);
  const queryClient = useQueryClient();
  const org = useOrg();

  const {
    data: scores,
    isLoading,
    refetch,
  } = useQuery({
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

  useEffect(() => {
    refetch();
  }, [promptVersions]);

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
