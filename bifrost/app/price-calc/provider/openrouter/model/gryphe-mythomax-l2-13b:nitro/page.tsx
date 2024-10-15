"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GrypheMythomaxL213bnitroPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gryphe/mythomax-l2-13b:nitro" provider="openrouter" />
    </div>
  );
}