"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TextAda001PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="text-ada-001" provider="azure" />
    </div>
  );
}