import React from "react";
import { PreviewCard } from "./previewCard";
import { Feature } from "./previewCard";

interface FeaturePreviewSectionCleanProps {
  features: Record<string, Feature>;
  highlightedFeature?: string;
}

export const FeaturePreviewSectionClean = ({
  features,
  highlightedFeature = "sessionsAndTraces",
}: FeaturePreviewSectionCleanProps) => {
  const remainingFeatures = Object.entries(features)
    .filter(([key]) => key !== highlightedFeature)
    .map(([_, feature]) => feature);

  return (
    <div className="bg-[hsl(var(--background))] rounded-3xl mt-4">
      <div className="w-full flex-col justify-start items-start gap-20 inline-flex mx-auto">
        {remainingFeatures.map((feature, index) => (
          <PreviewCard
            key={index}
            feature={feature}
            position={index % 2 === 0 ? "left" : "right"}
            isHighlighted={false}
          />
        ))}
      </div>
    </div>
  );
};
