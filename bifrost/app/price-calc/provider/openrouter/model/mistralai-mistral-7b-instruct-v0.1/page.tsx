"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMistral7bInstructV01PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/mistral-7b-instruct-v0.1" provider="openrouter" />
    </div>
  );
}