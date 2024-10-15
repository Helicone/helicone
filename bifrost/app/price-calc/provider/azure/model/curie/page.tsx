"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function CuriePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="curie" provider="azure" />
    </div>
  );
}