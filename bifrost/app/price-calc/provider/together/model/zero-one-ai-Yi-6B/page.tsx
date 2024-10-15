"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function ZeroOneAiYi6BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="zero-one-ai/Yi-6B" provider="together" />
    </div>
  );
}