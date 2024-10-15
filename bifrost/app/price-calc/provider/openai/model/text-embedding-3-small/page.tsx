"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TextEmbedding3SmallPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="text-embedding-3-small" provider="openai" />
    </div>
  );
}