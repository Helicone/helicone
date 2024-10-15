"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenrouterFlavorOfTheWeekPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="openrouter/flavor-of-the-week" provider="openrouter" />
    </div>
  );
}