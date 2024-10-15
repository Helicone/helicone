"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenaiGpt4oMiniPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="openai/gpt-4o-mini" provider="openrouter" />
    </div>
  );
}