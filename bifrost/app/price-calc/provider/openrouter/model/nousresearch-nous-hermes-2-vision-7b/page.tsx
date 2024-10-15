"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousresearchNousHermes2Vision7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nousresearch/nous-hermes-2-vision-7b" provider="openrouter" />
    </div>
  );
}