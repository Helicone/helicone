import React from "react";
import { ClaudeImage } from "./ClaudeImage";
import { OpenAIImage, UnsupportedImage } from "../renderingUtils";

export const ImageItem: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  if (
    item.type === "image_url" &&
    (typeof item.image_url === "string" || item.image_url?.url)
  ) {
    return (
      <OpenAIImage
        item={item}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
      />
    );
  } else if (item.type === "image" && item.source?.data) {
    return (
      <ClaudeImage
        item={item}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
      />
    );
  } else if (item.type === "image_url" || item.type === "image") {
    return <UnsupportedImage />;
  }
  return null;
};
