"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function BabbagePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="babbage" provider="azure" />
    </div>
  );
}