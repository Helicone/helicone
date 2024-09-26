import React from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";

export const HypothesisCellRenderer: React.FC<any> = (params) => {
  const { data, colDef } = params;

  const hypothesisId = colDef.field;

  const responseData = data[hypothesisId];
  const content = responseData
    ? JSON.parse(responseData)?.body?.choices?.[0]?.message?.content
    : null;

  const isLoading = data.isLoading?.[hypothesisId];

  if (isLoading) {
    return (
      <div className="w-full h-full whitespace-pre-wrap">
        <div>Generating...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full whitespace-pre-wrap">
      {content ? (
        <div>{content}</div>
      ) : (
        <div>
          <Button
            variant="ghost"
            onClick={() =>
              params.handleRunHypothesis(hypothesisId, [data.dataset_row_id])
            }
          >
            <PlayIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
