"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MicrosoftPhi3Mini128kInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="microsoft/phi-3-mini-128k-instruct" provider="openrouter" />
    </div>
  );
}