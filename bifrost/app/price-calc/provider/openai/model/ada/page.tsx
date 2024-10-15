"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AdaPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="ada" provider="openai" />
    </div>
  );
}