"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Model01AiYi34b200kPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="01-ai/yi-34b-200k" provider="openrouter" />
    </div>
  );
}