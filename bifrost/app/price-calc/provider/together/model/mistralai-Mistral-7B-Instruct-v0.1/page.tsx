"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMistral7BInstructV01PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/Mistral-7B-Instruct-v0.1" provider="together" />
    </div>
  );
}