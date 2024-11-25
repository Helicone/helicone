import ScoresGraph from "./ScoresGraph";
import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type PromptVersion = {
  id: string;
  metadata: Record<string, any>;
  major_version: number;
  minor_version: number;
};

const ScoresGraphContainer = ({
  experimentId,
  // fetchExperimentHypothesisScores,
  promptVersions,
}: {
  promptVersions: PromptVersion[];
  experimentId: string;
  // fetchExperimentHypothesisScores: (
  //   hypothesisId: string
  // ) => Promise<Record<string, any>>;
}) => {
  // const [scores, setScores] = useState<Record<string, Record<string, any>>>({});
  // const [loading, setLoading] = useState(true);

  const { fetchExperimentHypothesisScores } = useExperimentScores(experimentId);
  const queryClient = useQueryClient();
  const {
    data: scores,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["experimentScores", experimentId],
    queryFn: async () => {
      const scoresData: Record<string, Record<string, any>> = {};
      await Promise.all(
        promptVersions.map(async (promptVersion) => {
          if (promptVersion.id) {
            scoresData[promptVersion.id] =
              await fetchExperimentHypothesisScores(promptVersion.id);
          }
        })
      );
      return scoresData;
    },
    onSuccess: (data) => {
      Object.entries(data).forEach(([promptVersionId, score]) => {
        queryClient.setQueryData(
          ["experimentScores", experimentId, promptVersionId],
          score ?? ""
        );
      });
    },
    cacheTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // useEffect(() => {
  // const fetchScores = async () => {
  //   const scoresData: Record<string, Record<string, any>> = {};
  //   await Promise.all(
  //     promptVersions.map(async (promptVersion) => {
  //       if (promptVersion.id) {
  //         scoresData[promptVersion.id] =
  //           await fetchExperimentHypothesisScores(promptVersion.id);
  //       }
  //     })
  //   );

  //   setScores(scoresData);
  //   setLoading(false);
  // };

  // fetchScores();
  // }, [promptVersions, fetchExperimentHypothesisScores]);

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
