import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React, { useState } from "react";
import { EvaluatorConfigForm } from "./EvaluatorConfigForm";
import { EvaluatorTypeDropdown } from "./EvaluatorTypeDropdown";

export const CreateNewEvaluatorSheetContent: React.FC<{
  onSubmit: (evaluatorId: string) => void;
  hideButton?: boolean;
}> = ({ onSubmit, hideButton = false }) => {
  const [selectedOption, setSelectedOption] = useState<string>("LLM");

  return (
    <>
      <SheetTrigger asChild>
        {!hideButton && (
          <Button size="sm_sleek" variant="outline">
            Create New Evaluator
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[800px] sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>{"Create New Evaluator"}</SheetTitle>
          <SheetDescription>
            <EvaluatorTypeDropdown
              selectedOption={selectedOption}
              onOptionSelect={setSelectedOption}
            />
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <EvaluatorConfigForm
            evaluatorType={selectedOption}
            onSubmit={onSubmit}
          />
        </div>
      </SheetContent>
    </>
  );
};
