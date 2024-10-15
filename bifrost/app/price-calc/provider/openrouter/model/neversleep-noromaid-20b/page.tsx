"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NeversleepNoromaid20bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="neversleep/noromaid-20b" provider="openrouter" />
    </div>
  );
}