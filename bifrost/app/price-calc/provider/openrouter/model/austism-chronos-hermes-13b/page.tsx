"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AustismChronosHermes13bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="austism/chronos-hermes-13b" provider="openrouter" />
    </div>
  );
}