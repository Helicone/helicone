import { Message } from "@/components/templates/requests/mapper/types";
import React from "react";

export const OpenAIImage: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  const imageUrl =
    typeof item.image_url === "string" ? item.image_url : item.image_url.url;

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
}> = ({ message }) => (
  <>
    {message.tool_calls?.map((toolCall, index) => (
      <div
        className="flex flex-col space-y-2"
        key={`${index}-${toolCall.name}`}
      >
        <code className="text-xs whitespace-pre-wrap font-semibold">
          {toolCall.name}
        </code>
        <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
          {typeof toolCall.arguments === "object"
            ? JSON.stringify(toolCall.arguments, null, 2)
            : toolCall.arguments}
        </pre>
      </div>
    ))}
  </>
);
