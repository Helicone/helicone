import React from "react";
import { RenderImageWithPrettyInputKeys } from "../RenderImageWithPrettyInputKeys";

const isBase64 = (str: string): boolean => {
  try {
    // Check if it's a URL
    new URL(str);
    return false;
  } catch {
    // Check if it looks like base64 (rough check)
    return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
  }
};

export const ImageItem: React.FC<{
  imageUrl: string;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ imageUrl, selectedProperties, isHeliconeTemplate }) => {
  if (isHeliconeTemplate) {
    return (
      <RenderImageWithPrettyInputKeys
        text={imageUrl}
        selectedProperties={selectedProperties}
      />
    );
  }

  const imageSrc = isBase64(imageUrl)
    ? `data:image/jpeg;base64,${imageUrl}`
    : imageUrl;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageSrc} alt="" width={600} height={600} />;
};
