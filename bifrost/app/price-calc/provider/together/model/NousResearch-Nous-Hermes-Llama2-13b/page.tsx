"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousResearchNousHermesLlama213bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="NousResearch/Nous-Hermes-Llama2-13b" provider="together" />
    </div>
  );
}