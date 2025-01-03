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
  scoringType: string
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
  evaluators: ReturnType<typeof useEvaluators>["evaluators"];
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"];
}

const EvaluatorDetailsSheet: React.FC<EvaluatorDetailsSheetProps> = ({
  selectedEvaluatorId,
  setSelectedEvaluatorId,
  evaluators: evaluators,
  deleteEvaluator,
}) => {
  const evaluator = useMemo(() => {
    return evaluators.data?.data?.data?.find(
      (e) =>
        getEvaluatorScoreName(e.name, e.scoring_type) === selectedEvaluatorId ||
        e.name === selectedEvaluatorId
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
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto ">
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
