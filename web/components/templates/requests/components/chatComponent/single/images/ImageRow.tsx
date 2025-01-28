import React from "react";
import { RenderWithPrettyInputKeys } from "../../../../../playground/chatRow";

import { ImageItem } from "./ImageItem";
import { Message } from "@/packages/llm-mapper/types";

export const ImageRow: React.FC<{
  message: Message;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ message, selectedProperties, isHeliconeTemplate }) => {
  return (
    <div className="flex flex-col space-y-4 divide-y divide-gray-100 dark:divide-gray-900">
      <RenderWithPrettyInputKeys
        text={message.content ?? ""}
        selectedProperties={selectedProperties}
      />
      <div className="flex flex-wrap items-center pt-4">
        <ImageItem
          imageUrl={message.image_url ?? "no image"}
          selectedProperties={selectedProperties}
          isHeliconeTemplate={isHeliconeTemplate}
        />
      </div>
    </div>
  );
};
