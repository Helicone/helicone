import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import React, { useEffect, useState } from "react";
import {
  EvaluatorType,
  EvaluatorTypeDropdown,
  LLM_AS_A_JUDGE_OPTIONS,
  COMPOSITE_OPTIONS,
} from "./EvaluatorTypeDropdown";
import {
  LLMEvaluatorConfigFormPreset,
  LLMEvaluatorConfigForm,
} from "./LLMEvaluatorConfigForm";
import { PythonEvaluatorConfigForm } from "./PythonEvaluatorConfigForm";

export const CreateNewEvaluatorSheetContent: React.FC<{
  onSubmit: (evaluatorId: string) => void;
  hideButton?: boolean;
  buttonJSX?: React.ReactNode;
}> = ({ onSubmit, hideButton = false, buttonJSX }) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    LLM_AS_A_JUDGE_OPTIONS[0].name
  );

  const [presets, setPresets] = useState<EvaluatorType>(
    LLM_AS_A_JUDGE_OPTIONS[0]
  );
  const [tab, setTab] = useState<string>("llm-as-a-judge");

  useEffect(() => {
    if (presets._type === "llm") {
      setTab("llm-as-a-judge");
    } else {
      setTab("python");
    }
  }, [presets]);

  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <SheetTrigger asChild>
          {buttonJSX ? (
            buttonJSX
          ) : (
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
                  setPresets(option);
                }}
              />
            </SheetDescription>
          </SheetHeader>
          <TabsContent value="llm-as-a-judge">
            <div className="flex-grow overflow-hidden">
              <LLMEvaluatorConfigForm
                evaluatorType={selectedOption}
                onSubmit={onSubmit}
                configFormParams={
                  presets._type === "llm"
                    ? presets.preset
                    : LLM_AS_A_JUDGE_OPTIONS[0].preset
                }
                setConfigFormParams={(preset) => {
                  setPresets((prev) => ({
                    ...prev,
                    preset: preset,
                    _type: "llm",
                  }));
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="python">
            <PythonEvaluatorConfigForm
              configFormParams={
                presets.preset && presets._type === "composite"
                  ? presets.preset
                  : COMPOSITE_OPTIONS[0].preset
              }
            />
          </TabsContent>
        </SheetContent>
      </Tabs>
    </>
  );
};
