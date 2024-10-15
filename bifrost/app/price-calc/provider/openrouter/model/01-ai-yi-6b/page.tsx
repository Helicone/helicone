"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Model01AiYi6bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="01-ai/yi-6b" provider="openrouter" />
    </div>
  );
}