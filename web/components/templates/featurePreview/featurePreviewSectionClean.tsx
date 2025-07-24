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
    <div className="mt-4 rounded-3xl bg-[hsl(var(--background))]">
      <div className="mx-auto inline-flex w-full flex-col items-start justify-start gap-20">
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
