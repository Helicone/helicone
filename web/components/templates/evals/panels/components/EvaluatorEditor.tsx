import React from "react";
import LLMAsJudgeEvaluatorDetails from "../../details/LLMAsJudgeEvaluatorDetails";
import PythonEvaluatorDetails from "../../details/PythonEvaluatorDetails";
import LastMileEvaluatorDetails from "../../details/LastMileEvaluatorDetails";
import { UseMutationResult } from "@tanstack/react-query";

interface EvaluatorEditorProps {
  evaluator: any; // Replace with proper type
  deleteEvaluator: UseMutationResult<any, unknown, string, unknown>;
}

export const EvaluatorEditor: React.FC<EvaluatorEditorProps> = ({
  evaluator,
  deleteEvaluator,
}) => {
  if (!evaluator) return <p>This evaluator is a default evaluator.</p>;

  if (evaluator.llm_template) {
    return (
      <LLMAsJudgeEvaluatorDetails
        evaluator={evaluator}
        deleteEvaluator={deleteEvaluator}
        setSelectedEvaluator={() => {}}
      />
    );
  } else if (evaluator.code_template) {
    return (
      <PythonEvaluatorDetails
        evaluator={evaluator}
        deleteEvaluator={deleteEvaluator}
        setSelectedEvaluator={() => {}}
      />
    );
  } else if (evaluator.last_mile_config) {
    return (
      <LastMileEvaluatorDetails
        evaluator={evaluator}
        deleteEvaluator={deleteEvaluator}
        setSelectedEvaluator={() => {}}
      />
    );
  } else {
    return <p>This evaluator is a default evaluator.</p>;
  }
};

export default EvaluatorEditor;
