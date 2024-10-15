"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function CohereCommandRPlusPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="cohere/command-r-plus" provider="openrouter" />
    </div>
  );
}