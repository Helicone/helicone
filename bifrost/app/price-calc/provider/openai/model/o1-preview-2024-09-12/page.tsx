"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function O1Preview20240912PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="o1-preview-2024-09-12" provider="openai" />
    </div>
  );
}