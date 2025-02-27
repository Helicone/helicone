import { isJSON } from "@/packages/llm-mapper/utils/contentHelpers";
import React from "react";

export const renderFunctionCall = (
  name: string,
  args: string,
  key?: number
) => (
  <pre
    key={key}
    className="text-xs whitespace-pre-wrap rounded-lg overflow-auto"
  >
    {`${name}(${
      isJSON(args) ? JSON.stringify(JSON.parse(args), null, 2) : args
    })`}
  </pre>
);
