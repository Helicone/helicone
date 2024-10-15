"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaMetaLlama38BInstructTurboPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/Meta-Llama-3-8B-Instruct-Turbo" provider="together" />
    </div>
  );
}