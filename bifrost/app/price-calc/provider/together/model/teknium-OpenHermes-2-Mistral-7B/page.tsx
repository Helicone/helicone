"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TekniumOpenHermes2Mistral7BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="teknium/OpenHermes-2-Mistral-7B" provider="together" />
    </div>
  );
}