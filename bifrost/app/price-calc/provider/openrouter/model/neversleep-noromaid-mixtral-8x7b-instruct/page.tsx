"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NeversleepNoromaidMixtral8x7bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="neversleep/noromaid-mixtral-8x7b-instruct" provider="openrouter" />
    </div>
  );
}