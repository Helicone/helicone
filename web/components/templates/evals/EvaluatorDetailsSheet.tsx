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
import { EvalMetric } from "./EvaluratorColumns";
import LLMAsJudgeEvaluatorDetails from "./LLMAsJudgeEvaluatorDetails";

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
  selectedEvaluator: EvalMetric | null;
  setSelectedEvaluator: (evaluator: EvalMetric | null) => void;
  LLMAsJudgeEvaluators: ReturnType<typeof useEvaluators>["evaluators"];
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"];
}

const EvaluatorDetailsSheet: React.FC<EvaluatorDetailsSheetProps> = ({
  selectedEvaluator,
  setSelectedEvaluator,
  LLMAsJudgeEvaluators,
  deleteEvaluator,
}) => {
  const LLMAsJudgeEvaluator = useMemo(() => {
    return LLMAsJudgeEvaluators.data?.data?.data?.find(
      (e) =>
        getEvaluatorScoreName(e.name, e.scoring_type) ===
          selectedEvaluator?.name || e.name === selectedEvaluator?.name
    );
  }, [LLMAsJudgeEvaluators, selectedEvaluator]);

  return (
    <Sheet
      open={!!selectedEvaluator}
      onOpenChange={() => setSelectedEvaluator(null)}
    >
      <SheetTrigger asChild>
        <span style={{ display: "none" }}></span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto ">
        <SheetHeader>
          <SheetTitle>{selectedEvaluator?.name}</SheetTitle>
        </SheetHeader>
        <SheetDescription>
          {LLMAsJudgeEvaluator ? (
            <LLMAsJudgeEvaluatorDetails
              evaluator={LLMAsJudgeEvaluator}
              deleteEvaluator={deleteEvaluator}
              setSelectedEvaluator={setSelectedEvaluator}
            />
          ) : (
            <p>This evaluator is a default evaluator.</p>
          )}
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
};

export default EvaluatorDetailsSheet;
