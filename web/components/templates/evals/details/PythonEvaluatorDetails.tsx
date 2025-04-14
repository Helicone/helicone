import { Col } from "@/components/layout/common";
import React from "react";
import { useEvaluators } from "../EvaluatorHook";
import { Evaluator } from "./types";
import { PythonEvaluatorConfigForm } from "@/components/templates/evals/CreateNewEvaluator/PythonEvaluatorConfigForm";

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
  return (
    <Col className="space-y-4">
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
    </Col>
  );
};

export default PythonEvaluatorDetails;
