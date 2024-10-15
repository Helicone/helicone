"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Sao10kL3Stheno8bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="sao10k/l3-stheno-8b" provider="openrouter" />
    </div>
  );
}