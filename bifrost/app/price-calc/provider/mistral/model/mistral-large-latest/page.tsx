"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralLargeLatestPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistral-large-latest" provider="mistral" />
    </div>
  );
}