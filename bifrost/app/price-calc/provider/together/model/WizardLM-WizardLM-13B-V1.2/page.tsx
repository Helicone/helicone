"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function WizardLMWizardLM13BV12PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="WizardLM/WizardLM-13B-V1.2" provider="together" />
    </div>
  );
}