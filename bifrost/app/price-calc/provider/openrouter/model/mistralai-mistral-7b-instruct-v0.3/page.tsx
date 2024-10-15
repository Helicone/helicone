"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMistral7bInstructV03PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/mistral-7b-instruct-v0.3" provider="openrouter" />
    </div>
  );
}