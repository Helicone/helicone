import { useJawnClient } from "@/lib/clients/jawnHook";
import { useMutation } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { useInvalidateEvaluators } from "../EvaluatorHook";
import { LLMEvaluatorConfigFormPreset } from "../CreateNewEvaluator/LLMEvaluatorConfigForm";
import { useEvalFormStore } from "../store/evalFormStore";

// LLM Evaluator Submit Hook
export const useLLMEvaluatorSubmit = (onSuccess: (data?: any) => void) => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const invalidateEvaluators = useInvalidateEvaluators();
  const { setIsSubmitting } = useEvalFormStore();

  return useMutation({
    mutationFn: async ({
      configFormParams,
      openAIFunction,
      existingEvaluatorId,
    }: {
      configFormParams: LLMEvaluatorConfigFormPreset;
      openAIFunction: string;
      existingEvaluatorId?: string;
    }) => {
      setIsSubmitting(true);
      try {
        if (existingEvaluatorId) {
          const result = await jawn.PUT("/v1/evaluator/{evaluatorId}", {
            params: {
              path: {
                evaluatorId: existingEvaluatorId,
              },
            },
            body: {
              name: configFormParams.name,
              llm_template: openAIFunction,
              scoring_type: `LLM-${configFormParams.expectedValueType.toUpperCase()}`,
            },
          });

          if (!result.data?.data) {
            notification.setNotification("Failed to update evaluator", "error");
            throw new Error("Failed to update evaluator");
          }

          notification.setNotification(
            "Evaluator updated successfully",
            "success"
          );
          return result.data;
        } else {
          const result = await jawn.POST("/v1/evaluator", {
            body: {
              name: configFormParams.name,
              llm_template: openAIFunction,
              scoring_type: `LLM-${configFormParams.expectedValueType.toUpperCase()}`,
            },
          });

          if (!result.data?.data) {
            notification.setNotification("Failed to create evaluator", "error");
            throw new Error("Failed to create evaluator");
          }

          notification.setNotification(
            "Evaluator created successfully",
            "success"
          );
          return result.data;
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data) => {
      invalidateEvaluators.invalidate();
      onSuccess(data);
    },
  });
};

// Python Evaluator Submit Hook
export const usePythonEvaluatorSubmit = (onSuccess: () => void) => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const invalidateEvaluators = useInvalidateEvaluators();
  const { setIsSubmitting } = useEvalFormStore();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      code,
      existingEvaluatorId,
    }: {
      name: string;
      description: string;
      code: string;
      existingEvaluatorId?: string;
    }) => {
      setIsSubmitting(true);
      try {
        if (existingEvaluatorId) {
          const result = await jawn.PUT("/v1/evaluator/{evaluatorId}", {
            params: {
              path: {
                evaluatorId: existingEvaluatorId,
              },
            },
            body: {
              name,
              code_template: { code },
              scoring_type: "PYTHON",
            },
          });

          if (!result.data?.data) {
            notification.setNotification("Failed to update evaluator", "error");
            throw new Error("Failed to update evaluator");
          }

          notification.setNotification(
            "Evaluator updated successfully",
            "success"
          );
          return result.data;
        } else {
          const result = await jawn.POST("/v1/evaluator", {
            body: {
              name,
              code_template: { code },
              scoring_type: "PYTHON",
            },
          });

          if (!result.data?.data) {
            notification.setNotification("Failed to create evaluator", "error");
            throw new Error("Failed to create evaluator");
          }

          notification.setNotification(
            "Evaluator created successfully",
            "success"
          );
          return result.data;
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      invalidateEvaluators.invalidate();
      onSuccess();
    },
  });
};

// LastMile Evaluator Submit Hook
export const useLastMileEvaluatorSubmit = (onSuccess: () => void) => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const invalidateEvaluators = useInvalidateEvaluators();
  const { setIsSubmitting } = useEvalFormStore();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      config,
      existingEvaluatorId,
    }: {
      name: string;
      description: string;
      config: any; // Using any for now, should be properly typed
      existingEvaluatorId?: string;
    }) => {
      setIsSubmitting(true);
      try {
        if (existingEvaluatorId) {
          const result = await jawn.PUT("/v1/evaluator/{evaluatorId}", {
            params: {
              path: {
                evaluatorId: existingEvaluatorId,
              },
            },
            body: {
              name,
              last_mile_config: config,
              scoring_type: "LAST_MILE",
            },
          });

          if (!result.data?.data) {
            notification.setNotification("Failed to update evaluator", "error");
            throw new Error("Failed to update evaluator");
          }

          notification.setNotification(
            "Evaluator updated successfully",
            "success"
          );
          return result.data;
        } else {
          const result = await jawn.POST("/v1/evaluator", {
            body: {
              name,
              last_mile_config: config,
              scoring_type: "LAST_MILE",
            },
          });

          if (!result.data?.data) {
            notification.setNotification("Failed to create evaluator", "error");
            throw new Error("Failed to create evaluator");
          }

          notification.setNotification(
            "Evaluator created successfully",
            "success"
          );
          return result.data;
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      invalidateEvaluators.invalidate();
      onSuccess();
    },
  });
};
