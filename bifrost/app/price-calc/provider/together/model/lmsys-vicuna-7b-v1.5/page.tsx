"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function LmsysVicuna7bV15PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="lmsys/vicuna-7b-v1.5" provider="together" />
    </div>
  );
}