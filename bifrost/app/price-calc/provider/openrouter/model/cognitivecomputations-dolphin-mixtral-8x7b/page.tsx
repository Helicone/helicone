"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function CognitivecomputationsDolphinMixtral8x7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="cognitivecomputations/dolphin-mixtral-8x7b" provider="openrouter" />
    </div>
  );
}