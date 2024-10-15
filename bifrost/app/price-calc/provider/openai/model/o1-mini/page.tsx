"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function O1MiniPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="o1-mini" provider="openai" />
    </div>
  );
}