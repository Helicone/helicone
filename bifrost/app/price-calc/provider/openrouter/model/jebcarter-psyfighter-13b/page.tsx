"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function JebcarterPsyfighter13bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="jebcarter/psyfighter-13b" provider="openrouter" />
    </div>
  );
}