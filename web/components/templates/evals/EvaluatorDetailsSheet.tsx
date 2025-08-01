import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React, { useMemo } from "react";
import { useEvaluators } from "./EvaluatorHook";
import LLMAsJudgeEvaluatorDetails from "./details/LLMAsJudgeEvaluatorDetails";
import PythonEvaluatorDetails from "./details/PythonEvaluatorDetails";

export function getEvaluatorScoreName(
  evaluatorName: string,
  scoringType: string,
) {
  return (
    evaluatorName
      .toLowerCase()
      .replace(" ", "_")
      .replace(/[^a-z0-9]+/g, "_") +
    (scoringType === "LLM-BOOLEAN" ? "-hcone-bool" : "")
  );
}

interface EvaluatorDetailsSheetProps {
  selectedEvaluatorId: string | null;
  setSelectedEvaluatorId: (evaluatorId: string | null) => void;
}

const EvaluatorDetailsSheet: React.FC<EvaluatorDetailsSheetProps> = ({
  selectedEvaluatorId,
  setSelectedEvaluatorId,
}) => {
  const { evaluators: evaluators, deleteEvaluator } = useEvaluators();

  const evaluator = useMemo(() => {
    return evaluators.data?.data?.data?.find(
      (e) =>
        getEvaluatorScoreName(e.name, e.scoring_type) === selectedEvaluatorId ||
        e.name === selectedEvaluatorId,
    );
  }, [evaluators, selectedEvaluatorId]);

  return (
    <Sheet
      open={!!selectedEvaluatorId}
      onOpenChange={() => setSelectedEvaluatorId(null)}
    >
      <SheetTrigger asChild>
        <span style={{ display: "none" }}></span>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{evaluator?.name}</SheetTitle>
        </SheetHeader>
        <SheetDescription>
          {evaluator ? (
            evaluator.llm_template ? (
              <LLMAsJudgeEvaluatorDetails
                evaluator={evaluator}
                deleteEvaluator={deleteEvaluator}
                setSelectedEvaluator={(evalVar) => {
                  setSelectedEvaluatorId(evalVar?.id ?? null);
                }}
              />
            ) : (
              <PythonEvaluatorDetails
                evaluator={evaluator}
                deleteEvaluator={deleteEvaluator}
                setSelectedEvaluator={(evalVar) => {
                  setSelectedEvaluatorId(evalVar?.id ?? null);
                }}
              />
            )
          ) : (
            <p>This evaluator is a default evaluator.</p>
          )}
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
};

export default EvaluatorDetailsSheet;
