import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrg } from "@/components/layout/organizationContext";

import { getJawnClient } from "@/lib/clients/jawn";
import useNotification from "@/components/shared/notification/useNotification";
import { useCallback } from "react";

const useExperimentScores = (experimentId: string) => {
  const org = useOrg();
  const currentOrgId = org?.currentOrg?.id;

  const jawn = getJawnClient(currentOrgId);
  const notification = useNotification();

  const queryClient = useQueryClient();

  const {
    data: allEvaluators,
    isLoading: isAllEvaluatorsLoading,
    refetch: refetchAllEvaluators,
  } = useQuery({
    queryKey: ["all-evaluators", org?.currentOrg?.id],
    queryFn: async (query) => {
      const currentOrgId = query.queryKey[1];

      const jawn = getJawnClient(currentOrgId);
      const evaluators = await jawn.POST("/v1/evaluator/query", {
        body: {},
      });
      return evaluators;
    },
  });

  const {
    data: evaluators,
    isLoading: isEvaluatorsLoading,
    refetch: refetchEvaluators,
  } = useQuery({
    queryKey: ["evaluators", experimentId, currentOrgId],
    queryFn: async (query) => {
      const evaluators = await jawn.GET(
        "/v2/experiment/{experimentId}/evaluators",
        {
          params: {
            path: {
              experimentId: experimentId,
            },
          },
        }
      );
      return evaluators;
    },
  });

  const addEvaluator = useMutation({
    mutationFn: async (evaluatorId: string) => {
      const jawn = getJawnClient(currentOrgId);
      console.log("evaluatorId", evaluatorId);
      const evaluator = await jawn.POST(
        "/v2/experiment/{experimentId}/evaluators",
        {
          params: {
            path: {
              experimentId: experimentId,
            },
          },
          body: {
            evaluatorId: evaluatorId,
          },
        }
      );
      if (!evaluator.response.ok) {
        notification.setNotification(
          `Failed to add evaluator: ${evaluator.response.statusText}`,
          "error"
        );
      }
    },
    onSuccess: () => {
      refetchEvaluators();
      refetchAllEvaluators();
      queryClient.setQueryData(["shouldRunEvaluators", experimentId], true);
    },
  });

  const removeEvaluator = useMutation({
    mutationFn: async (evaluatorId: string) => {
      const evaluator = await jawn.DELETE(
        "/v2/experiment/{experimentId}/evaluators/{evaluatorId}",
        {
          params: {
            path: {
              experimentId: experimentId,
              evaluatorId: evaluatorId,
            },
          },
        }
      );
    },
    onSuccess: () => {
      refetchEvaluators();
      refetchAllEvaluators();
      queryClient.invalidateQueries({
        queryKey: ["evaluators", experimentId, currentOrgId],
      });
      queryClient.invalidateQueries({
        queryKey: ["experimentScores", experimentId],
      });
    },
  });

  const runEvaluators = useMutation({
    mutationFn: async () => {
      return await jawn.POST(`/v2/experiment/{experimentId}/evaluators/run`, {
        params: {
          path: {
            experimentId: experimentId,
          },
        },
      });
    },
    onSuccess: () => {
      refetchEvaluators();
      refetchAllEvaluators();
      queryClient.invalidateQueries({
        queryKey: ["evaluators", experimentId, currentOrgId],
      });
      queryClient.invalidateQueries({
        queryKey: ["experimentScores", experimentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["shouldRunEvaluators", experimentId],
      });
    },
  });

  const fetchExperimentHypothesisScores = useCallback(
    async (promptVersionId: string) => {
      const result = await jawn.GET(
        "/v2/experiment/{experimentId}/{promptVersionId}/scores",
        {
          params: {
            path: {
              experimentId,
              promptVersionId,
            },
          },
        }
      );
      return result.data ?? {};
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentOrgId, experimentId]
  );

  const shouldRunEvaluators = useQuery({
    queryKey: ["shouldRunEvaluators", experimentId],
    queryFn: async () => {
      const result = await jawn.GET(
        "/v2/experiment/{experimentId}/should-run-evaluators",
        {
          params: {
            path: {
              experimentId,
            },
          },
        }
      );
      return result.data?.data ?? false;
    },
  });

  return {
    evaluators,
    addEvaluator,
    allEvaluators,
    removeEvaluator,
    runEvaluators,
    fetchExperimentHypothesisScores,
    shouldRunEvaluators,
  };
};

export { useExperimentScores };
