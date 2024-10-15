"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousresearchNousHermes2Mixtral8x7bSftPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nousresearch/nous-hermes-2-mixtral-8x7b-sft" provider="openrouter" />
    </div>
  );
}