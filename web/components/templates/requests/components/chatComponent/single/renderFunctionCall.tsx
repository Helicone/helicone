import { isJSON } from "@/packages/llm-mapper/utils/contentHelpers";
import React from "react";
import { JsonRenderer } from "./JsonRenderer";

export const renderFunctionCall = (
  name: string,
  args: string,
  key?: number
) => {
  const parsedArgs = isJSON(args) ? JSON.parse(args) : args;

  return (
    <div
      key={key}
      className="text-xs rounded-lg overflow-auto bg-gray-50 dark:bg-gray-800 p-3 my-2 border border-gray-200 dark:border-gray-700"
    >
      <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-1">
        {name}
      </div>
      <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
        {isJSON(args) ? (
          <JsonRenderer data={parsedArgs} />
        ) : (
          <pre className="whitespace-pre-wrap">{args}</pre>
        )}
      </div>
    </div>
  );
};
