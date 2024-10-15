"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GrypheMythomaxL213bextendedPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gryphe/mythomax-l2-13b:extended" provider="openrouter" />
    </div>
  );
}