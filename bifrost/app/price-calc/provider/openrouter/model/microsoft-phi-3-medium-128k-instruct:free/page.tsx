"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MicrosoftPhi3Medium128kInstructfreePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="microsoft/phi-3-medium-128k-instruct:free" provider="openrouter" />
    </div>
  );
}