"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenOrcaMistral7bOpenorcaPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="open-orca/mistral-7b-openorca" provider="openrouter" />
    </div>
  );
}