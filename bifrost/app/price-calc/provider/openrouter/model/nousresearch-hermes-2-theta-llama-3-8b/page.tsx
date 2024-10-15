"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousresearchHermes2ThetaLlama38bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nousresearch/hermes-2-theta-llama-3-8b" provider="openrouter" />
    </div>
  );
}