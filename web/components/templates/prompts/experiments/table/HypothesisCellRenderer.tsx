import React, { useState, useEffect } from "react";
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

  // Add state for loading status
  const [loadingStatus, setLoadingStatus] = useState<
    "queued" | "running" | null
  >(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      setLoadingStatus("queued");
      timer = setTimeout(() => {
        setLoadingStatus("running");
      }, 3000); // 3 seconds
    } else {
      setLoadingStatus(null);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading]);

  if (isLoading) {
    if (loadingStatus === "queued") {
      return (
        <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
          <span className="animate-ping inline-flex rounded-full bg-yellow-700 h-2 w-2"></span>
          <div className="italic ">Queued...</div>
        </div>
      );
    } else if (loadingStatus === "running") {
      return (
        <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
          <span className="animate-ping inline-flex rounded-full bg-green-700 h-2 w-2"></span>
          <div className="itas">Running...</div>
        </div>
      );
    }
  }

  return (
    <div
      className={`w-full h-full items-center flex ${
        content ? "justify-start" : "justify-end"
      }`}
    >
      {content ? (
        <div>{content}</div>
      ) : (
        <div>
          <Button
            variant="ghost"
            className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
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
