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

interface EvaluatorDetailsSheetProps {
  selectedEvaluator: EvalMetric | null;
  setSelectedEvaluator: (evaluator: EvalMetric | null) => void;
  LLMAsJudgeEvaluators: ReturnType<typeof useEvaluators>["evaluators"]; // Replace 'any' with the correct type
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"]; // Replace 'any' with the correct type
}

const EvaluatorDetailsSheet: React.FC<EvaluatorDetailsSheetProps> = ({
  selectedEvaluator,
  setSelectedEvaluator,
  LLMAsJudgeEvaluators,
  deleteEvaluator,
}) => {
  const LLMAsJudgeEvaluator = useMemo(() => {
    return LLMAsJudgeEvaluators.data?.data?.data?.find(
      (e) => e.name === selectedEvaluator?.name
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
      <SheetContent className="w-[50vw] max-w-[50vw] sm:max-w-[50vw]">
        <SheetHeader>
          <SheetTitle>{selectedEvaluator?.name}</SheetTitle>
        </SheetHeader>
        <SheetDescription>
          {LLMAsJudgeEvaluator && (
            <LLMAsJudgeEvaluatorDetails
              evaluator={LLMAsJudgeEvaluator}
              deleteEvaluator={deleteEvaluator}
              setSelectedEvaluator={setSelectedEvaluator}
            />
          )}
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
};

export default EvaluatorDetailsSheet;
