import React from "react";
import { P } from "@/components/ui/typography";
import { useEvaluators } from "../EvaluatorHook";
import { Evaluator } from "./types";

interface PythonEvaluatorDetailsProps {
  evaluator: Evaluator;
  deleteEvaluator: ReturnType<typeof useEvaluators>["deleteEvaluator"];
  setSelectedEvaluator: (evaluator: Evaluator | null) => void;
}

const PythonEvaluatorDetails: React.FC<PythonEvaluatorDetailsProps> = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <P>
        Python evaluators are no longer supported. This evaluator no longer runs
        and can&apos;t be edited or tested. You can still delete it.
      </P>
    </div>
  );
};

export default PythonEvaluatorDetails;
