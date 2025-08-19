import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "../../../components/layout/org/organizationContext";
import { $JAWN_API, getJawnClient } from "../../../lib/clients/jawn";
import { logger } from "@/lib/telemetry/logger";

const useExperiments = (
  req: { page: number; pageSize: number },
  promptId?: string,
) => {
  const { data, isLoading, refetch, isRefetching } = $JAWN_API.useQuery(
    "post",
    "/v1/experiment/query",
    {
      body: {
        filter: promptId
          ? {
              experiment: {
                prompt_v2: {
                  equals: promptId,
                },
              },
            }
          : {},
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: 5_000,
    },
  );

  const experiments = data?.data;

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
    logger.info(
      {
        runs: hypothesis?.runs,
      },
      "Hypothesis runs",
    );
    return {
      id: experiment.id,
      datasetId: experiment.dataset.id,
      datasetName: experiment.dataset.name,
      experimentName: (experiment.meta as any).experiment_name ?? null,
      promptId: (experiment.meta as any).prompt_id ?? null,
      promptVersionId: (experiment.meta as any).prompt_version ?? null,
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

const useExperimentTables = () => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = $JAWN_API.useQuery(
    "get",
    "/v2/experiment",
    {},
    {
      refetchOnWindowFocus: false,
    },
  );
  const deleteExperiment = useMutation({
    mutationFn: async (experimentId: string) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.DELETE("/v2/experiment/{experimentId}", {
        params: { path: { experimentId } },
      });
      queryClient.invalidateQueries({
        queryKey: ["experimentTables", orgId],
      });
    },
  });

  const experiments = data?.data;

  if (!experiments) {
    return {
      isLoading,
      refetch,
      isRefetching,
      experiments: [],
      deleteExperiment,
    };
  }

  return {
    isLoading,
    refetch,
    isRefetching,
    experiments: experiments.map((experiment) => ({
      ...experiment,
      model: "unknown",
    })),
    deleteExperiment,
  };
};

const useExperimentTableMetadata = (req: { id: string }) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experimentTableMetadata", req.id, org?.currentOrg?.id],
    queryFn: async (query) => {
      const id = query.queryKey[1] as string;
      const jawn = getJawnClient(org?.currentOrg?.id);

      const res = await jawn.POST(
        "/v1/experiment/table/{experimentTableId}/metadata/query",
        {
          params: {
            path: {
              experimentTableId: id ?? "",
            },
          },
        },
      );

      return res.data?.data;
    },
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    experiment: data,
  };
};

const useExperiment = (id: string) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["experiment", id, org?.currentOrg?.id],
    queryFn: async (query) => {
      const id = query.queryKey[1];
      const orgId = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);
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

export {
  useExperiment,
  useExperiments,
  useExperimentTables,
  useExperimentTableMetadata,
};
