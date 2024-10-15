"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function PygmalionaiMythalion13bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="pygmalionai/mythalion-13b" provider="openrouter" />
    </div>
  );
}