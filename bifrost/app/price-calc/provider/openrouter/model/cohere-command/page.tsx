"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function CohereCommandPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="cohere/command" provider="openrouter" />
    </div>
  );
}