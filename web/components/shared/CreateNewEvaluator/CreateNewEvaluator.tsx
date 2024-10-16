import React from "react";
import { CreateNewEvaluatorSheetContent } from "./CreateNewEvaluatorSheetContent";
import { Sheet } from "@/components/ui/sheet";

export const CreateNewEvaluator: React.FC<{
  onSubmit: (evaluatorId: string) => void;
}> = ({ onSubmit }) => {
  return (
    <>
      <Sheet>
        <CreateNewEvaluatorSheetContent onSubmit={onSubmit} />
      </Sheet>
    </>
  );
};
