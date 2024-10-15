"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousResearchNousHermesLlama27bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="NousResearch/Nous-Hermes-llama-2-7b" provider="together" />
    </div>
  );
}