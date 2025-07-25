import { isJSON } from "@helicone-package/llm-mapper/utils/contentHelpers";
import React from "react";
import { JsonRenderer } from "./JsonRenderer";

export const renderFunctionCall = (
  name: string,
  args: string,
  key?: number,
) => {
  const parsedArgs = isJSON(args) ? JSON.parse(args) : args;

  return (
    <div
      key={key}
      className="my-2 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
        {name}
      </div>
      <div className="border-l-2 border-gray-300 pl-4 dark:border-gray-600">
        {isJSON(args) ? (
          <JsonRenderer data={parsedArgs} />
        ) : (
          <pre className="whitespace-pre-wrap">{args}</pre>
        )}
      </div>
    </div>
  );
};
