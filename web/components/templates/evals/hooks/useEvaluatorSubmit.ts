import { useJawnClient } from "@/lib/clients/jawnHook";
import { useMutation } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { useInvalidateEvaluators } from "../EvaluatorHook";
import { LLMEvaluatorConfigFormPreset } from "../CreateNewEvaluator/LLMEvaluatorConfigForm";
import { useEvalFormStore } from "../store/evalFormStore";

export interface LLMRangeConfig {
  rangeMin: number;
  rangeMax: number;
}

export interface LLMChoiceConfig {
  choices: Array<{ score: number; description: string }>;
}

export interface LLMBooleanConfig {
  type: "boolean";
}

export type LLMJudgeConfig =
  | LLMBooleanConfig
  | LLMRangeConfig
  | LLMChoiceConfig;
export type EvaluatorModelOptions = "gpt-4o" | "gpt-4o-mini" | "gpt-3.5-turbo";

export function isLLMBooleanConfig(
  config: LLMJudgeConfig
): config is LLMBooleanConfig {
  return (
    typeof config === "object" && "type" in config && config.type === "boolean"
  );
}

export function isLLMRangeConfig(
  config: LLMJudgeConfig
): config is LLMRangeConfig {
  return (
    typeof config === "object" && "rangeMin" in config && "rangeMax" in config
  );
}

export function isLLMChoiceConfig(
  config: LLMJudgeConfig
): config is LLMChoiceConfig {
  return typeof config === "object" && "choices" in config;
}

// Helper function to get the correct judge configuration based on evaluator type
const getJudgeConfig = (
  configFormParams: LLMEvaluatorConfigFormPreset
): LLMJudgeConfig => {
  switch (configFormParams.expectedValueType) {
    case "boolean":
      return {
        type: "boolean",
      };
    case "choice":
      return {
        choices: configFormParams.choiceScores || [],
      };
    case "range":
      return {
        rangeMin: configFormParams.rangeMin || 0,
        rangeMax: configFormParams.rangeMax || 100,
      };
    default:
      return {
        type: "boolean",
      };
  }
};

// LLM Evaluator Submit Hook
export const useLLMEvaluatorSubmit = (onSuccess: () => void) => {
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
          const isBoolean = configFormParams.expectedValueType === "boolean";
          const result = await jawn.PUT("/v1/evaluator/{evaluatorId}", {
            params: {
              path: {
                evaluatorId: existingEvaluatorId,
              },
            },
            body: {
              name: configFormParams.name,
              description: configFormParams.description,
              model: configFormParams.model as EvaluatorModelOptions,
              judge_config: getJudgeConfig(configFormParams),
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
              description: configFormParams.description,
              model: configFormParams.model as EvaluatorModelOptions,
              judge_config: getJudgeConfig(configFormParams),
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
    onSuccess: () => {
      invalidateEvaluators.invalidate();
      onSuccess();
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
              description,
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
              description,
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
              description,
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
              description,
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
