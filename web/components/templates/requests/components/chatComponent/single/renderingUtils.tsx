import { Message } from "@helicone-package/llm-mapper/types";
import React, { useMemo, useState } from "react";
import { JsonRenderer } from "./JsonRenderer";
import { isJSON } from "@helicone-package/llm-mapper/utils/contentHelpers";
import { ImageModal } from "./images/ImageModal";

export const OpenAIImage: React.FC<{
  imageUrl: string;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ imageUrl, selectedProperties, isHeliconeTemplate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageUrl} 
        alt="" 
        width={600} 
        height={600}
        className="cursor-pointer transition-opacity hover:opacity-90"
        onClick={() => setIsModalOpen(true)}
      />
      
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageSrc={imageUrl}
      />
    </>
  );
};

export const UnsupportedImage: React.FC = () => (
  <div className="flex h-[150px] w-[200px] items-center justify-center border border-gray-300 bg-white text-center text-xs italic text-gray-500 dark:border-gray-700 dark:bg-black">
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
          <code className="whitespace-pre-wrap text-xs font-semibold">
            {toolCall.name}
          </code>
          {argumentString && (
            <pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-950">
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
