import { useQuery } from "@tanstack/react-query";

import { UserMetric } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../lib/filters/filterDefs";
import { SortLeafUsers } from "../../lib/sorts/users/sorts";
import { PromptsResult } from "../../../pages/api/prompt";
import { ExperimentResult } from "../../../pages/api/experiment";
import { Experiment } from "../../../pages/api/experiment/[id]";

const useExperiments = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experiments"],
    queryFn: async (query) => {
      return await fetch("/api/experiment", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json() as Promise<ExperimentResult>);
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    experiments: data?.data?.experiments,
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

export { useExperiments, useExperiment };
