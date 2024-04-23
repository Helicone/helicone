import { useQuery } from "@tanstack/react-query";

import { useJawnClient } from "../../../lib/clients/jawnHook";
import { Result } from "../../../lib/result";
import { Experiment } from "../../../pages/api/experiment/[id]";

const useExperiments = (req: { page: number; pageSize: number }) => {
  const jawn = useJawnClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experiments", jawn],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;

      return jawn.POST("/v1/experiment/query", {
        body: {
          filter: "all",
        },
      });
    },
    refetchOnWindowFocus: false,
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
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experiment", id],
    queryFn: async (query) => {
      const id = query.queryKey[1];
      return await fetch(`/api/experiment/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json() as Promise<Result<Experiment, string>>);
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    experiment: data?.data,
  };
};

export { useExperiment, useExperiments };
