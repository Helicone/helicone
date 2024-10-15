"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousresearchNousHermesLlama270bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nousresearch/nous-hermes-llama2-70b" provider="openrouter" />
    </div>
  );
}