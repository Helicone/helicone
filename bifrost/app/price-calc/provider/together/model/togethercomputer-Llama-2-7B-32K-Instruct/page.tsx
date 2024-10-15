"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TogethercomputerLlama27B32KInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="togethercomputer/Llama-2-7B-32K-Instruct" provider="together" />
    </div>
  );
}