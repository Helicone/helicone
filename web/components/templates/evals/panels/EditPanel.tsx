import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import LLMAsJudgeEvaluatorDetails from "../details/LLMAsJudgeEvaluatorDetails";
import PythonEvaluatorDetails from "../details/PythonEvaluatorDetails";
import { getEvaluatorScoreName } from "../EvaluatorDetailsSheet";
import { useEvaluators } from "../EvaluatorHook";
import { PanelType } from "./types";
import { Evaluator } from "../details/types";
import {
  LLMEvaluatorConfigFormPreset,
  useLLMConfigStore,
} from "@/components/shared/CreateNewEvaluator/LLMEvaluatorConfigForm";

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

  const { setLLMEvaluatorConfigFormPreset } = useLLMConfigStore();

  useEffect(() => {
    if (evaluator) {
      setLLMEvaluatorConfigFormPreset(getInitialState(evaluator));
    }
  }, [evaluator, setLLMEvaluatorConfigFormPreset]);

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
          ) : (
            <PythonEvaluatorDetails
              evaluator={evaluator}
              deleteEvaluator={deleteEvaluator}
              setSelectedEvaluator={(evalVar) => {}}
            />
          )
        ) : (
          <p>This evaluator is a default evaluator.</p>
        )}
      </div>
    </Col>
  );
};
