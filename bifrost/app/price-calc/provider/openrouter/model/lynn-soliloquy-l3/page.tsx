"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function LynnSoliloquyL3PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="lynn/soliloquy-l3" provider="openrouter" />
    </div>
  );
}