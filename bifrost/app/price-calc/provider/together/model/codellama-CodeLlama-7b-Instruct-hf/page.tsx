"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function CodellamaCodeLlama7bInstructHfPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="codellama/CodeLlama-7b-Instruct-hf" provider="together" />
    </div>
  );
}