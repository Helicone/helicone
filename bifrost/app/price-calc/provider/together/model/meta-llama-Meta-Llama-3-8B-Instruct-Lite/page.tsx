"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaMetaLlama38BInstructLitePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/Meta-Llama-3-8B-Instruct-Lite" provider="together" />
    </div>
  );
}