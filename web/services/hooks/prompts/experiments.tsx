import { useQuery } from "@tanstack/react-query";

import { useJawnClient } from "../../../lib/clients/jawnHook";

const useExperiments = (
  req: { page: number; pageSize: number },
  promptId: string
) => {
  const jawn = useJawnClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experiments", jawn],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;

      return jawn.POST("/v1/experiment/query", {
        body: {
          filter: {
            experiment: {
              prompt_v2: {
                equals: promptId,
              },
            },
          },
        },
      });
    },
    refetchOnWindowFocus: false,
    // refetch every 5 seconds
    refetchInterval: 5_000,
  });

  const experiments = data?.data?.data;

  if (!experiments) {
    return {
      isLoading,
      refetch,
      isRefetching,
      experiments: [],
    };
  }

  const frontEndExperiments = experiments.map((experiment) => {
    const hypothesis = experiment.hypotheses.at(0) ?? null;
    console.log(hypothesis?.runs);
    return {
      id: experiment.id,
      datasetId: experiment.dataset.id,
      datasetName: experiment.dataset.name,
      model: hypothesis?.model,
      createdAt: experiment.createdAt,
      runCount: hypothesis?.runs?.length,
      status: hypothesis?.status,
    };
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    experiments: frontEndExperiments,
  };
};

const useExperiment = (id: string) => {
  const jawn = useJawnClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experiment", id],
    queryFn: async (query) => {
      const id = query.queryKey[1];
      return jawn.POST("/v1/experiment/query", {
        body: {
          filter: {
            experiment: {
              id: {
                equals: id,
              },
            },
          },
          include: {
            inputs: true,
            promptVersion: true,
            responseBodies: true,
          },
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    experiment: data?.data?.data?.[0],
  };
};

export { useExperiment, useExperiments };
