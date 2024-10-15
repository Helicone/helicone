"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMixtral8x7bInstructnitroPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/mixtral-8x7b-instruct:nitro" provider="openrouter" />
    </div>
  );
}