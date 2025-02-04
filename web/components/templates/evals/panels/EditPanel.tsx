import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { Dispatch, SetStateAction, useMemo } from "react";
import LLMAsJudgeEvaluatorDetails from "../details/LLMAsJudgeEvaluatorDetails";
import PythonEvaluatorDetails from "../details/PythonEvaluatorDetails";
import LastMileEvaluatorDetails from "../details/LastMileEvaluatorDetails";
import { getEvaluatorScoreName } from "../EvaluatorDetailsSheet";
import { useEvaluators } from "../EvaluatorHook";
import { PanelType } from "./types";

export const EditPanel = ({
  setPanels,
  panels,
  selectedEvaluatorId,
}: {
  setPanels: Dispatch<SetStateAction<PanelType[]>>;
  panels: PanelType[];
  selectedEvaluatorId: string;
}) => {
  const { evaluators: evaluators, deleteEvaluator } = useEvaluators();

  const evaluator = useMemo(() => {
    return evaluators.data?.data?.data?.find(
      (e) =>
        getEvaluatorScoreName(e.name, e.scoring_type) === selectedEvaluatorId ||
        e.name === selectedEvaluatorId
    );
  }, [evaluators, selectedEvaluatorId]);

  return (
    <Col className="h-full">
      <Row className="justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setPanels((prev) => prev.filter((p) => p._type !== "edit"));
          }}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </Row>{" "}
      <div className="w-full px-10 overflow-y-auto">
        <h1 className="text-xl font-medium">Edit evaluator</h1>
        {evaluator ? (
          evaluator.llm_template ? (
            <LLMAsJudgeEvaluatorDetails
              evaluator={evaluator}
              deleteEvaluator={deleteEvaluator}
              setSelectedEvaluator={(evalVar) => {}}
            />
          ) : evaluator.code_template ? (
            <PythonEvaluatorDetails
              evaluator={evaluator}
              deleteEvaluator={deleteEvaluator}
              setSelectedEvaluator={(evalVar) => {}}
            />
          ) : evaluator.last_mile_config ? (
            <LastMileEvaluatorDetails
              evaluator={evaluator}
              deleteEvaluator={deleteEvaluator}
              setSelectedEvaluator={(evalVar) => {}}
            />
          ) : (
            <p>This evaluator is a default evaluator.</p>
          )
        ) : (
          <p>This evaluator is a default evaluator.</p>
        )}
      </div>
    </Col>
  );
};
