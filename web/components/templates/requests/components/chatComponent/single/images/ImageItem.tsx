import React, { useState } from "react";
import Image from "next/image";
import { RenderImageWithPrettyInputKeys } from "../RenderImageWithPrettyInputKeys";
import { ImageModal } from "./ImageModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = () => setIsModalOpen(true);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenModal();
    }
  };

  // Generate a descriptive alt text based on the image source
  const getImageDescription = () => {
    if (isBase64(imageUrl)) {
      return "Base64 encoded image from API request or response - click or press Enter/Space to view full size";
    }
    return `Image from ${new URL(imageSrc).hostname} - click or press Enter/Space to view full size`;
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        onKeyDown={handleKeyDown}
        className="cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-0 border-0 bg-transparent"
        aria-label="Open image in modal dialog"
        type="button"
      >
        <Image
          src={imageSrc}
          alt={getImageDescription()}
          width={600}
          height={600}
          className="rounded"
        />
      </button>
      
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageSrc={imageSrc}
      />
    </>
  );
};
