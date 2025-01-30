import { Col } from "@/components/layout/common";
import React, { useState } from "react";
import { useEvaluators } from "../EvaluatorHook";
import { DeleteEvaluator } from "./DeleteEvalutor";
import { ExperimentsForEvaluator } from "./Experiments";
import { useEvaluatorDetails } from "./hooks";
import { OnlineEvaluatorsSection } from "./OnlineEvaluatorsSection";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { onlineEvaluators, createOnlineEvaluator, deleteOnlineEvaluator } =
    useEvaluatorDetails(evaluator, () => {
      setShowCreateModal(false);
    });

  return (
    <Col className="space-y-4">
      <p>This evaluator is a Last Mile evaluator.</p>

      <Col className="space-y-2">
        <LastMileDevConfigForm
          onSubmit={() => {}}
          existingEvaluatorId={evaluator.id}
          preset={evaluator.last_mile_config as LastMileConfigForm}
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

export default LastMileEvaluatorDetails;
