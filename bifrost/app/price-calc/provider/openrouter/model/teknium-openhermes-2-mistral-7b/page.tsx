"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TekniumOpenhermes2Mistral7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="teknium/openhermes-2-mistral-7b" provider="openrouter" />
    </div>
  );
}