import { LLMEvaluatorConfigFormPreset } from "@/components/shared/CreateNewEvaluator/LLMEvaluatorConfigForm";
import {
  EvaluatorTestResult,
  TestInput,
} from "@/components/shared/CreateNewEvaluator/types";
import {
  COMPOSITE_OPTIONS,
  LLM_AS_A_JUDGE_OPTIONS,
} from "@/components/templates/evals/testing/examples";

export type TestFunction = (
  testInputs: TestInput
) => Promise<EvaluatorTestResult>;

export type TestData =
  | {
      _type: "llm";
      evaluator_llm_template: string;
      evaluator_scoring_type: string;
      evaluator_name: string;
      testInput: TestInput;
    }
  | {
      _type: "python";
      evaluator_name: string;
      code: string;
      testInput: TestInput;
    };
export type CompositeOption = {
  name: string;
  _type: "composite";
  preset: {
    code: string;
    description: string;
    testInput?: TestInput;
  };
};
export type LLMOption = {
  name: string;
  preset: LLMEvaluatorConfigFormPreset;
  _type: "llm";
};
export type EvaluatorType =
  | (typeof LLM_AS_A_JUDGE_OPTIONS)[number]
  | (typeof COMPOSITE_OPTIONS)[number];
