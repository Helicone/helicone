"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function FireworksFirellava13bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="fireworks/firellava-13b" provider="openrouter" />
    </div>
  );
}