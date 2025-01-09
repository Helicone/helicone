import { EvaluatorTestResult } from "@/components/templates/evals/CreateNewEvaluator/types";
import { TestData } from "./types";

import { ClientType } from "@/lib/clients/jawn";

export async function testEvaluator(
  testData: TestData,
  jawn: ClientType
): Promise<EvaluatorTestResult> {
  if (testData._type === "llm") {
    const result = await jawn.POST("/v1/evaluator/llm/test", {
      body: {
        evaluatorConfig: {
          evaluator_scoring_type: testData.evaluator_scoring_type,
          evaluator_llm_template: testData.evaluator_llm_template,
        },
        testInput: testData.testInput,
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
        testInput: testData.testInput,
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
  } else {
    throw new Error("Invalid test data type");
  }
}
