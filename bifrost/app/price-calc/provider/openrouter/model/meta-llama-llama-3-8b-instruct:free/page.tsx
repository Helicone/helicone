"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaLlama38bInstructfreePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/llama-3-8b-instruct:free" provider="openrouter" />
    </div>
  );
}