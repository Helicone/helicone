import React from "react";
import { isJSON } from "./utils";

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
