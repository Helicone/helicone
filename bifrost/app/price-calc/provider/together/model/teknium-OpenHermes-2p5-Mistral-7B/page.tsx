"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TekniumOpenHermes2p5Mistral7BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="teknium/OpenHermes-2p5-Mistral-7B" provider="together" />
    </div>
  );
}