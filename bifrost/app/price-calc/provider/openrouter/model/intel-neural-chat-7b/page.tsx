"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function IntelNeuralChat7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="intel/neural-chat-7b" provider="openrouter" />
    </div>
  );
}