"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AustismChronosHermes13bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Austism/chronos-hermes-13b" provider="together" />
    </div>
  );
}