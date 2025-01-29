import {
  EvaluatorTestResult,
  TestInput,
} from "@/components/templates/evals/CreateNewEvaluator/types";
import { ClientType } from "@/lib/clients/jawn";
import { TestConfig } from "./types";

export async function testEvaluator(
  testData: TestConfig,
  jawn: ClientType,
  testInput: TestInput
): Promise<EvaluatorTestResult> {
  if (testData._type === "llm") {
    const result = await jawn.POST("/v1/evaluator/llm/test", {
      body: {
        evaluatorConfig: {
          evaluator_scoring_type: testData.evaluator_scoring_type,
          evaluator_llm_template: testData.evaluator_llm_template,
        },
        testInput: testInput,
        evaluatorName: testData.evaluator_name,
      },
    });
    if (result?.data?.data?.score !== undefined) {
      return {
        traces: [],
        output: result.data.data.score?.toString() ?? "Unknown error",
        _type: "completed",
      };
    } else {
      return {
        _type: "error",
        error: result?.error ?? "Unknown error - try again",
      };
    }
  } else if (testData._type === "python") {
    const result = await jawn.POST("/v1/evaluator/python/test", {
      body: {
        code: testData.code,
        testInput: testInput,
      },
    });
    if (result?.data?.data) {
      return {
        ...(result?.data?.data ?? {}),
        _type: "completed",
      };
    } else {
      return {
        _type: "error",
        error: result?.data?.error ?? "Unknown error - try again",
      };
    }
  } else if (testData._type === "lastmile") {
    const result = await jawn.POST("/v1/evaluator/lastmile/test", {
      body: {
        config: testData.config,
        testInput: testInput,
      },
    });
    if (result?.data?.data) {
      return {
        output: result.data.data.score.toString(),
        traces: [
          `Input:\n${result.data.data.input}`,
          `Output:\n${result.data.data.output}`,
          `Ground Truth:\n${result.data.data.ground_truth}`,
        ],
        _type: "completed",
      };
    } else {
      return {
        _type: "error",
        error: result?.data?.error ?? "Unknown error - try again",
      };
    }
  } else {
    throw new Error("Invalid test data type");
  }
}
