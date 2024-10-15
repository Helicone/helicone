"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Model01AiYiLargePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="01-ai/yi-large" provider="openrouter" />
    </div>
  );
}