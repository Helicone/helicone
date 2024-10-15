"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NeversleepLlama3Lumimaid70bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="neversleep/llama-3-lumimaid-70b" provider="openrouter" />
    </div>
  );
}