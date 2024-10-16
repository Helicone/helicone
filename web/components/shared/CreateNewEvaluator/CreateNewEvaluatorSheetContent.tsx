import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React, { useState } from "react";
import {
  EvaluatorConfigForm,
  EvaluatorConfigFormPreset,
} from "./EvaluatorConfigForm";
import {
  EvaluatorTypeDropdown,
  LLM_AS_A_JUDGE_OPTIONS,
} from "./EvaluatorTypeDropdown";

export const CreateNewEvaluatorSheetContent: React.FC<{
  onSubmit: (evaluatorId: string) => void;
  hideButton?: boolean;
}> = ({ onSubmit, hideButton = false }) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    LLM_AS_A_JUDGE_OPTIONS[0].name
  );

  const [presets, setPresets] = useState<EvaluatorConfigFormPreset>(
    LLM_AS_A_JUDGE_OPTIONS[0].preset
  );
  return (
    <>
      <SheetTrigger asChild>
        {!hideButton && (
          <Button size="sm_sleek" variant="outline">
            Create New Evaluator
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[800px] sm:max-w-[800px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>{"Create New Evaluator"}</SheetTitle>
          <SheetDescription>
            <EvaluatorTypeDropdown
              selectedOption={selectedOption}
              onOptionSelect={(option) => {
                setSelectedOption(option.name);
                setPresets(option.preset);
              }}
            />
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="py-4">
            <EvaluatorConfigForm
              evaluatorType={selectedOption}
              onSubmit={onSubmit}
              configFormParams={presets}
              setConfigFormParams={setPresets}
            />
          </div>
        </div>
      </SheetContent>
    </>
  );
};
