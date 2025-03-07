import { Col } from "@/components/layout/common";
import { openAITemplateToOpenAIFunctionParams } from "@/components/templates/evals/CreateNewEvaluator/evaluatorHelpers";
import {
  LLMEvaluatorConfigForm,
  LLMEvaluatorConfigFormPreset,
  useLLMConfigStore,
} from "@/components/templates/evals/CreateNewEvaluator/LLMEvaluatorConfigForm";
import React, { useEffect, useMemo, useState } from "react";
import { useEvaluators } from "../EvaluatorHook";
import { DeleteEvaluator } from "./DeleteEvalutor";
import { ExperimentsForEvaluator } from "./Experiments";
import { useEvaluatorDetails } from "./hooks";
import { OnlineEvaluatorsSection } from "./OnlineEvaluatorsSection";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { onlineEvaluators, createOnlineEvaluator, deleteOnlineEvaluator } =
    useEvaluatorDetails(evaluator, () => {
      setShowCreateModal(false);
    });

  const { setLLMEvaluatorConfigFormPreset } = useLLMConfigStore();

  useEffect(() => {
    if (evaluator) {
      setLLMEvaluatorConfigFormPreset(getInitialState(evaluator));
    }
  }, [evaluator, setLLMEvaluatorConfigFormPreset]);

  return (
    <Col className="space-y-4">
      <p>This evaluator is a LLM as a judge evaluator.</p>

      <Col className="space-y-2">
        <LLMEvaluatorConfigForm
          onSubmit={() => {}}
          existingEvaluatorId={evaluator.id}
        />
      </Col>
      {onlineEvaluators.data?.data?.data && (
        <OnlineEvaluatorsSection
          onlineEvaluators={onlineEvaluators.data?.data?.data ?? []}
          createOnlineEvaluator={createOnlineEvaluator}
          deleteOnlineEvaluator={deleteOnlineEvaluator}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
        />
      )}
      <ExperimentsForEvaluator evaluator={evaluator} />
      <DeleteEvaluator
        evaluator={evaluator}
        setSelectedEvaluator={setSelectedEvaluator}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deleteEvaluator={deleteEvaluator}
      />
    </Col>
  );
};

export default LLMAsJudgeEvaluatorDetails;
