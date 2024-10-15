"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function CohereCommandRPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="cohere/command-r" provider="openrouter" />
    </div>
  );
}