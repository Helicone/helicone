"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousresearchNousHermes2Mixtral8x7bDpoPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nousresearch/nous-hermes-2-mixtral-8x7b-dpo" provider="openrouter" />
    </div>
  );
}