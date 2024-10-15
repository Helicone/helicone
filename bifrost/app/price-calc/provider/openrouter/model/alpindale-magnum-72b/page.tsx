"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AlpindaleMagnum72bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="alpindale/magnum-72b" provider="openrouter" />
    </div>
  );
}