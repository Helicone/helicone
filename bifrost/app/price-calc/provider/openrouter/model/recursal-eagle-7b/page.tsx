"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function RecursalEagle7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="recursal/eagle-7b" provider="openrouter" />
    </div>
  );
}