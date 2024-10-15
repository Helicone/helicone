"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMistral7bInstructV02PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/mistral-7b-instruct-v0.2" provider="openrouter" />
    </div>
  );
}