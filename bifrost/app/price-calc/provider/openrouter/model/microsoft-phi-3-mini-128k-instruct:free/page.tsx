"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MicrosoftPhi3Mini128kInstructfreePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="microsoft/phi-3-mini-128k-instruct:free" provider="openrouter" />
    </div>
  );
}