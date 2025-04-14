import { Col } from "@/components/layout/common";
import React from "react";
import { useEvaluators } from "../EvaluatorHook";
import { Evaluator } from "./types";
import { LastMileDevConfigForm } from "../CreateNewEvaluator/LastMileDevConfigForm";
import { LastMileConfigForm } from "../CreateNewEvaluator/types";

interface LastMileEvaluatorDetailsProps {
  evaluator: Evaluator;
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"];
  setSelectedEvaluator: (evaluator: Evaluator | null) => void;
}

const LastMileEvaluatorDetails: React.FC<LastMileEvaluatorDetailsProps> = ({
  evaluator,
  deleteEvaluator,
  setSelectedEvaluator,
}) => {
  return (
    <Col className="space-y-4">
      <LastMileDevConfigForm
        onSubmit={() => {}}
        existingEvaluatorId={evaluator.id}
        preset={evaluator.last_mile_config as LastMileConfigForm}
      />
    </Col>
  );
};

export default LastMileEvaluatorDetails;
