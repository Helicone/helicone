import { useJawnClient } from "@/lib/clients/jawnHook";
import { useMutation, useQuery } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";

export interface OnlineEvaluatorConfig {
  sampleRate: number;
  propertyFilters: { key: string; value: string }[];
}

export interface OnlineEvaluatorItem {
  id: string;
  name?: string;
  config: OnlineEvaluatorConfig;
}

export function useOnlineEvaluators(evaluatorId: string | undefined) {
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const {
    data: onlineEvaluators,
    isLoading: isLoadingOnlineEvaluators,
    refetch: refetchOnlineEvaluators,
  } = useQuery({
    queryKey: ["onlineEvaluators", evaluatorId],
    queryFn: async () => {
      return await jawn.GET("/v1/evaluator/{evaluatorId}/onlineEvaluators", {
        params: {
          path: {
            evaluatorId: evaluatorId!,
          },
        },
      });
    },
    enabled: !!evaluatorId,
  });

  const createOnlineEvaluator = useMutation({
    mutationFn: async (data: any) => {
      if (!evaluatorId) {
        throw new Error("No evaluator selected");
      }
      await jawn.POST("/v1/evaluator/{evaluatorId}/onlineEvaluators", {
        params: {
          path: {
            evaluatorId: evaluatorId!,
          },
        },
        body: data,
      });
    },
    onSuccess: () => {
      setNotification("Online evaluator created!", "success");
      refetchOnlineEvaluators();
    },
    onError: (error: Error) => {
      console.error("Error creating online evaluator:", error);
      setNotification("Error creating online evaluator", "error");
    },
  });

  return {
    onlineEvaluators: onlineEvaluators?.data?.data || [],
    isLoadingOnlineEvaluators,
    refetchOnlineEvaluators,
    createOnlineEvaluator,
  };
}
