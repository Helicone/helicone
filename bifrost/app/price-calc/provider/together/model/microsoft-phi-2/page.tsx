"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MicrosoftPhi2PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="microsoft/phi-2" provider="together" />
    </div>
  );
}