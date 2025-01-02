import { Col } from "@/components/layout/common";
import React, { useState } from "react";
import { useEvaluators } from "../EvaluatorHook";
import { DeleteEvaluator } from "./DeleteEvalutor";
import { ExperimentsForEvaluator } from "./Experiments";
import { useEvaluatorDetails } from "./hooks";
import { OnlineEvaluatorsSection } from "./OnlineEvaluatorsSection";
import { Evaluator } from "./types";
import { PythonEvaluatorConfigForm } from "@/components/shared/CreateNewEvaluator/PythonEvaluatorConfigForm";

interface PythonEvaluatorDetailsProps {
  evaluator: Evaluator;
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"];
  setSelectedEvaluator: (evaluator: Evaluator | null) => void;
}

const PythonEvaluatorDetails: React.FC<PythonEvaluatorDetailsProps> = ({
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

  return (
    <Col className="space-y-4">
      <p>This evaluator is a LLM as a judge evaluator.</p>

      <Col className="space-y-2">
        <h3 className="text-lg font-medium">LLM Template</h3>

        <PythonEvaluatorConfigForm
          configFormParams={{
            code: (evaluator.code_template as any)?.code ?? "",
            description: (evaluator.code_template as any)?.description ?? "",
            testInput: (evaluator.code_template as any)?.test_input,
          }}
          onSubmit={() => {}}
          name={evaluator.name}
          existingEvaluatorId={evaluator.id}
        />

        <span>Editing is not yet supported for LLM as a judge evaluators.</span>
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

export default PythonEvaluatorDetails;
