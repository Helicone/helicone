import React from "react";
import { Message } from "../types";
import { renderFunctionCall } from "./renderFunctionCall";

export const FunctionCall: React.FC<{ message: Message }> = ({ message }) => {
  if (message?.function_call) {
    return renderFunctionCall(
      message.function_call.name,
      message.function_call.arguments
    );
  } else if (
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  ) {
    return (
      <div className="flex flex-col space-y-2">
        {message.content !== null && message.content !== "" && (
          <div className="text-xs whitespace-pre-wrap font-semibold">
            {typeof message.content === "string" ? message.content : ""}
          </div>
        )}
        {message.tool_calls.map((tool, index) =>
          tool.function && typeof tool.function === "object"
            ? renderFunctionCall(
                tool.function.name,
                tool.function.arguments,
                index
              )
            : null
        )}
      </div>
    );
  } else if (Array.isArray(message.content)) {
    const toolUses = message.content.filter(
      (
        item
      ): item is {
        type: "tool_use";
        name: string;
        input: Record<string, any>;
      } =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "tool_use" &&
        "name" in item &&
        "input" in item
    );
    return (
      <div className="flex flex-col space-y-2">
        {toolUses.map((tool, index) =>
          renderFunctionCall(tool.name, JSON.stringify(tool.input), index)
        )}
      </div>
    );
  }
  return null;
};
