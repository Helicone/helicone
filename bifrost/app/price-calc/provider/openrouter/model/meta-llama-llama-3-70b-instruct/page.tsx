"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaLlama370bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/llama-3-70b-instruct" provider="openrouter" />
    </div>
  );
}