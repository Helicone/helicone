import React from "react";
import { Message } from "../types";
import { isJSON } from "./utils";

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
  formattedMessageContent: string;
}> = ({ message, formattedMessageContent }) => (
  <div className="flex flex-col space-y-2">
    <code className="text-xs whitespace-pre-wrap font-semibold">
      {message.name}
    </code>
    <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
      {isJSON(formattedMessageContent)
        ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
        : formattedMessageContent}
    </pre>
  </div>
);
