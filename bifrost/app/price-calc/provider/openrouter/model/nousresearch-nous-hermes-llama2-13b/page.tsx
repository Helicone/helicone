"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousresearchNousHermesLlama213bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nousresearch/nous-hermes-llama2-13b" provider="openrouter" />
    </div>
  );
}