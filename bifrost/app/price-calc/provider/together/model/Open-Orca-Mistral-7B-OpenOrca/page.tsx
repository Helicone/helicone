"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenOrcaMistral7BOpenOrcaPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Open-Orca/Mistral-7B-OpenOrca" provider="together" />
    </div>
  );
}