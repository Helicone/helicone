import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Evaluator } from "./types";
import { logger } from "@/lib/telemetry/logger";

export function useEvaluatorDetails(
  evaluator: Evaluator,
  onSuccess: () => void,
) {
  const org = useOrg();
  const { setNotification } = useNotification();

  const experiments = useQuery({
    queryKey: ["evaluatorExperiments", evaluator.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evaluator/{evaluatorId}/experiments", {
        params: { path: { evaluatorId: evaluator.id } },
      });
    },
  });

  const onlineEvaluators = useQuery({
    queryKey: ["onlineEvaluators", evaluator.id],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evaluator/{evaluatorId}/onlineEvaluators", {
        params: {
          path: {
            evaluatorId: evaluator.id,
          },
        },
      });
    },
  });

  const createOnlineEvaluator = useMutation({
    mutationFn: async (data: any) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const result = await jawn.POST(
        "/v1/evaluator/{evaluatorId}/onlineEvaluators",
        {
          params: { path: { evaluatorId: evaluator.id } },
          body: data,
        },
      );

      if (result.error) {
        throw new Error();
      }

      return result.data;
    },
    onSuccess: () => {
      setNotification("Online evaluator created!", "success");
      onlineEvaluators.refetch();

      onSuccess();
    },
    onError: (error: any) => {
      logger.error(
        { error, evaluatorId: evaluator.id },
        "Error creating online evaluator",
      );
      setNotification("Error creating online evaluator", "error");
    },
  });

  const deleteOnlineEvaluator = useMutation({
    mutationFn: async (onlineEvaluatorId: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const result = await jawn.DELETE(
        `/v1/evaluator/{evaluatorId}/onlineEvaluators/{onlineEvaluatorId}`,
        {
          params: {
            path: {
              evaluatorId: evaluator.id,
              onlineEvaluatorId: onlineEvaluatorId,
            },
          },
        },
      );

      if (result.error) {
        throw new Error();
      }

      return result.data;
    },
    onSuccess: () => {
      setNotification("Online evaluator deleted!", "success");
      onlineEvaluators.refetch();
    },
    onError: (error: any) => {
      logger.error(
        { error, evaluatorId: evaluator.id },
        "Error deleting online evaluator",
      );
      setNotification("Error deleting online evaluator", "error");
    },
  });

  return {
    experiments,
    onlineEvaluators,
    createOnlineEvaluator,
    deleteOnlineEvaluator,
  };
}
