"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GrypheMythomaxL213bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gryphe/mythomax-l2-13b" provider="openrouter" />
    </div>
  );
}