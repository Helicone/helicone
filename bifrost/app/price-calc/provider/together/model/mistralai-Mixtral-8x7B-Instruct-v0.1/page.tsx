"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMixtral8x7BInstructV01PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/Mixtral-8x7B-Instruct-v0.1" provider="together" />
    </div>
  );
}