"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaMetaLlama31405BInstructTurboPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo" provider="together" />
    </div>
  );
}