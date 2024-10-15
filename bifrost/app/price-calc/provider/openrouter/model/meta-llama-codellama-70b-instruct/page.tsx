"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaCodellama70bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/codellama-70b-instruct" provider="openrouter" />
    </div>
  );
}