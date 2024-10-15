"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MicrosoftWizardlm28x22bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="microsoft/wizardlm-2-8x22b" provider="openrouter" />
    </div>
  );
}