"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function PhindPhindCodellama34bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="phind/phind-codellama-34b" provider="openrouter" />
    </div>
  );
}