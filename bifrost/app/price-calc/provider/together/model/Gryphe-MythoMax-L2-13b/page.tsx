"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GrypheMythoMaxL213bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Gryphe/MythoMax-L2-13b" provider="together" />
    </div>
  );
}