import { Button } from "@/components/ui/button";
import { H3, P } from "@/components/ui/typography";
import { XIcon } from "lucide-react";
import React from "react";

interface EvaluatorNotFoundProps {
  closeEditPanel: () => void;
}

export const EvaluatorNotFound: React.FC<EvaluatorNotFoundProps> = ({
  closeEditPanel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="flex justify-between w-full mb-4">
        <H3>Evaluator Not Found</H3>
        <Button variant="ghost" size="icon" onClick={closeEditPanel}>
          <XIcon size={18} />
        </Button>
      </div>
      <P className="text-muted-foreground text-center mb-6">
        The selected evaluator could not be found. It may have been deleted or
        you may need to refresh the page.
      </P>
      <Button variant="outline" onClick={closeEditPanel}>
        Go Back
      </Button>
    </div>
  );
};

export default EvaluatorNotFound;
