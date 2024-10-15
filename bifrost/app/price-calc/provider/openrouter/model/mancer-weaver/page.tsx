"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MancerWeaverPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mancer/weaver" provider="openrouter" />
    </div>
  );
}