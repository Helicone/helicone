"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Sao10kL3Euryale70bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="sao10k/l3-euryale-70b" provider="openrouter" />
    </div>
  );
}