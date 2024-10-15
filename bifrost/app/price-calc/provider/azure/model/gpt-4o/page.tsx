"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Gpt4oPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gpt-4o" provider="azure" />
    </div>
  );
}