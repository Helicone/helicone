"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenaiGpt35TurboPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="openai/gpt-3.5-turbo" provider="openrouter" />
    </div>
  );
}