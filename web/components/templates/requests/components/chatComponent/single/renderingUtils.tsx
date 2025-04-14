import { Message } from "@/packages/llm-mapper/types";
import React, { useMemo } from "react";
import { JsonRenderer } from "./JsonRenderer";
import { isJSON } from "@/packages/llm-mapper/utils/contentHelpers";

export const OpenAIImage: React.FC<{
  imageUrl: string;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ imageUrl, selectedProperties, isHeliconeTemplate }) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt="" width={600} height={600} />;
};

export const UnsupportedImage: React.FC = () => (
  <div className="h-[150px] w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center items-center flex justify-center text-xs italic text-gray-500">
    Unsupported Image Type
  </div>
);

export const FunctionMessage: React.FC<{
  message: Message;
}> = ({ message }) => {
  const argumentString = useMemo(() => {
    if (!message.tool_calls) return "";
    if (typeof message.tool_calls?.[0]?.arguments === "object") {
      if (Array.isArray(message.tool_calls?.[0]?.arguments)) {
        return JSON.stringify(message.tool_calls?.[0]?.arguments, null, 2);
      }
      if (Object.keys(message.tool_calls?.[0]?.arguments).length > 0) {
        return JSON.stringify(message.tool_calls?.[0]?.arguments, null, 2);
      }
      return "";
    }
    return message.tool_calls?.[0]?.arguments;
  }, [message.tool_calls]);
  return (
    <>
      {message.tool_calls?.map((toolCall, index) => (
        <div
          className="flex flex-col space-y-2"
          key={`${index}-${toolCall.name}`}
        >
          <code className="text-xs whitespace-pre-wrap font-semibold">
            {toolCall.name}
          </code>
          {argumentString && (
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
              {isJSON(argumentString) ? (
                <JsonRenderer data={JSON.parse(argumentString)} />
              ) : (
                argumentString
              )}
            </pre>
          )}
        </div>
      ))}
    </>
  );
};
