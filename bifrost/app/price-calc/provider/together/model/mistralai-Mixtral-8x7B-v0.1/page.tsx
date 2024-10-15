"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MistralaiMixtral8x7BV01PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mistralai/Mixtral-8x7B-v0.1" provider="together" />
    </div>
  );
}