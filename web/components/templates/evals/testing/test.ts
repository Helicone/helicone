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
      // Handle error response - result can be any structure from the API
      const errorObj = result?.error ||
        result?.data?.error || { message: "Unknown error - try again" };
      const errorMessage =
        typeof errorObj === "object"
          ? JSON.stringify(errorObj, null, 2)
          : String(errorObj);

      return {
        _type: "error",
        error: errorMessage,
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
      // Handle error response - result can be any structure from the API
      const errorObj = result?.error ||
        result?.data?.error || { message: "Unknown error - try again" };
      const errorMessage =
        typeof errorObj === "object"
          ? JSON.stringify(errorObj, null, 2)
          : String(errorObj);

      return {
        _type: "error",
        error: errorMessage,
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
      // Handle error response - result can be any structure from the API
      const errorObj = result?.error ||
        result?.data?.error || { message: "Unknown error - try again" };
      const errorMessage =
        typeof errorObj === "object"
          ? JSON.stringify(errorObj, null, 2)
          : String(errorObj);

      return {
        _type: "error",
        error: errorMessage,
      };
    }
  } else {
    throw new Error("Invalid test data type");
  }
}
