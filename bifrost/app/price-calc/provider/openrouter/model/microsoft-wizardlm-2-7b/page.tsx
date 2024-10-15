"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MicrosoftWizardlm27bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="microsoft/wizardlm-2-7b" provider="openrouter" />
    </div>
  );
}