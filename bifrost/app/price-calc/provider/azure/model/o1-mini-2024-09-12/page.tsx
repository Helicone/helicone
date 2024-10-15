"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function O1Mini20240912PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="o1-mini-2024-09-12" provider="azure" />
    </div>
  );
}