import React from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";

interface HypothesisCellRendererProps {
  data: any;
  hypothesisId: string;
  handleRunHypothesis: (hypothesisId: string, datasetRowIds: string[]) => void;
}

export const HypothesisCellRenderer: React.FC<HypothesisCellRendererProps> = ({
  data,
  hypothesisId,
  handleRunHypothesis,
}) => {
  const responseData = data[hypothesisId];
  const content = responseData
    ? JSON.parse(responseData)?.body?.choices?.[0]?.message?.content
    : null;

  return (
    <div className="w-full h-full whitespace-pre-wrap">
      {content ? (
        <div>{content}</div>
      ) : (
        <div>
          <Button
            variant="ghost"
            onClick={() =>
              handleRunHypothesis(hypothesisId, [data.dataset_row_id])
            }
          >
            <PlayIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
