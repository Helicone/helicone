import { Col } from "@/components/layout/common";
import { openAITemplateToOpenAIFunctionParams } from "@/components/shared/CreateNewEvaluator/evaluatorHelpers";
import { LLMEvaluatorConfigForm } from "@/components/shared/CreateNewEvaluator/LLMEvaluatorConfigForm";
import React, { useMemo, useState } from "react";
import { useEvaluators } from "../EvaluatorHook";
import { DeleteEvaluator } from "./DeleteEvalutor";
import { ExperimentsForEvaluator } from "./Experiments";
import { useEvaluatorDetails } from "./hooks";
import { OnlineEvaluatorsSection } from "./OnlineEvaluatorsSection";
import { Evaluator } from "./types";

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
  const llmFunctionParams = useMemo(
    () =>
      openAITemplateToOpenAIFunctionParams(
        evaluator.llm_template,
        evaluator.scoring_type as "LLM-BOOLEAN" | "LLM-CHOICE" | "LLM-RANGE"
      ),
    [evaluator.llm_template, evaluator.scoring_type]
  );

  const [configFormParams, setConfigFormParams] = useState(llmFunctionParams);

  return (
    <Col className="space-y-4">
      <p>This evaluator is a LLM as a judge evaluator.</p>

      <Col className="space-y-2">
        <LLMEvaluatorConfigForm
          evaluator={evaluator}
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
