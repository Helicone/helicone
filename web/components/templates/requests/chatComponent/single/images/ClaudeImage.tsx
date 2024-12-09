import React from "react";
import { RenderImageWithPrettyInputKeys } from "../RenderImageWithPrettyInputKeys";

export const ClaudeImage: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  const imageUrl = item.source.data;
  if (isHeliconeTemplate) {
    return (
      <RenderImageWithPrettyInputKeys
        text={imageUrl}
        selectedProperties={selectedProperties}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt="" width={600} height={600} />;
};
