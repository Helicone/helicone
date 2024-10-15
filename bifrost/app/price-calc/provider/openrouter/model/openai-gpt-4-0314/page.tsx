"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenaiGpt40314PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="openai/gpt-4-0314" provider="openrouter" />
    </div>
  );
}