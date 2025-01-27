import React from "react";
import { RenderWithPrettyInputKeys } from "../../../../../../playground/chatRow";
import { Message } from "../../types";
import { ImageItem } from "./ImageItem";

export const ImageRow: React.FC<{
  message: Message;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ message, selectedProperties, isHeliconeTemplate }) => {
  const arr = message.content;
  if (!Array.isArray(arr)) return null;

  const textMessage = arr.find((message) => message.type === "text");

  return (
    <div className="flex flex-col space-y-4 divide-y divide-gray-100 dark:divide-gray-900">
      <RenderWithPrettyInputKeys
        text={textMessage?.text}
        selectedProperties={selectedProperties}
      />
      <div className="flex flex-wrap items-center pt-4">
        {arr.map((item, index) => (
          <ImageItem
            key={index}
            item={item}
            selectedProperties={selectedProperties}
            isHeliconeTemplate={isHeliconeTemplate}
          />
        ))}
      </div>
    </div>
  );
};
