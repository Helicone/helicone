"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Sao10kFimbulvetr11bV2PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="sao10k/fimbulvetr-11b-v2" provider="openrouter" />
    </div>
  );
}