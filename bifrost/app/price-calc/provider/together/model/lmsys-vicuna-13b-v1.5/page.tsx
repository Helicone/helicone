"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function LmsysVicuna13bV15PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="lmsys/vicuna-13b-v1.5" provider="together" />
    </div>
  );
}