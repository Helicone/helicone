import React, { useState } from "react";
import { RenderImageWithPrettyInputKeys } from "../RenderImageWithPrettyInputKeys";
import { ImageModal } from "./ImageModal";

export const ClaudeImage: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageUrl = item.source.data;

  if (isHeliconeTemplate) {
    return (
      <RenderImageWithPrettyInputKeys
        text={imageUrl}
        selectedProperties={selectedProperties}
      />
    );
  }

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
