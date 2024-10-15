"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMixtral8x22bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/mixtral-8x22b" provider="openrouter" />
    </div>
  );
}