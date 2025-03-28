import { Col } from "@/components/layout/common";
import {
  LLMEvaluatorConfigForm,
  LLMEvaluatorConfigFormPreset,
} from "@/components/templates/evals/CreateNewEvaluator/LLMEvaluatorConfigForm";
import { useEvalConfigStore } from "../store/evalConfigStore";
import React, { useEffect } from "react";
import { useEvaluators } from "../EvaluatorHook";
import { Evaluator } from "./types";

const getInitialState = (
  evaluator: Evaluator
): LLMEvaluatorConfigFormPreset => {
  const template = evaluator.llm_template as any;
  const property =
    template.tools[0].function.parameters.properties[evaluator.name];
  const propertyDescription = property?.description;
  const rangeMin = property?.minimum;
  const rangeMax = property?.maximum;

  return {
    name: evaluator.name,
    description: propertyDescription,
    expectedValueType: evaluator.scoring_type
      .replace("LLM-", "")
      .toLowerCase() as "boolean" | "choice" | "range",
    includedVariables: {
      inputs: true,
      promptTemplate: false,
      inputBody: false,
      outputBody: true,
    },
    choiceScores: evaluator.scoring_type === "LLM-CHOICE" ? [] : undefined,
    rangeMin: evaluator.scoring_type === "LLM-RANGE" ? rangeMin : undefined,
    rangeMax: evaluator.scoring_type === "LLM-RANGE" ? rangeMax : undefined,
    model: template.model,
    testInput: undefined,
  };
};

interface LLMAsJudgeEvaluatorDetailsProps {
  evaluator: Evaluator;
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"];
  setSelectedEvaluator: (evaluator: Evaluator | null) => void;
}

const LLMAsJudgeEvaluatorDetails: React.FC<LLMAsJudgeEvaluatorDetailsProps> = ({
  evaluator,
  deleteEvaluator,
  setSelectedEvaluator,
}) => {
  const { setLLMConfig } = useEvalConfigStore();

  useEffect(() => {
    setLLMConfig(getInitialState(evaluator));
  }, [evaluator, setLLMConfig]);

  return (
    <Col className="space-y-4">
      <LLMEvaluatorConfigForm
        onSubmit={() => {}}
        existingEvaluatorId={evaluator.id}
      />
    </Col>
  );
};

export default LLMAsJudgeEvaluatorDetails;
