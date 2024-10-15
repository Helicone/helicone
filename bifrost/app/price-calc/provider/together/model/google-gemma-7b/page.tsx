"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GoogleGemma7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="google/gemma-7b" provider="together" />
    </div>
  );
}