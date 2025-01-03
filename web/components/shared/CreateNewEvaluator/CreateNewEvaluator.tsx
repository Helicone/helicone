import React from "react";
import { CreateNewEvaluatorSheetContent } from "./CreateNewEvaluatorSheetContent";
import { Sheet } from "@/components/ui/sheet";

export const CreateNewEvaluator: React.FC<{
  onSubmit: (evaluatorId: string) => void;
  buttonJSX?: React.ReactNode;
}> = ({ onSubmit, buttonJSX }) => {
  return (
    <>
      <Sheet>
        <CreateNewEvaluatorSheetContent
          onSubmit={onSubmit}
          buttonJSX={buttonJSX}
          hideButton={!!buttonJSX}
        />
      </Sheet>
    </>
  );
};
