"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TogethercomputerGPTJTModeration6BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="togethercomputer/GPT-JT-Moderation-6B" provider="together" />
    </div>
  );
}