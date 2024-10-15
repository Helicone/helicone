"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function OpenchatOpenchat8bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="openchat/openchat-8b" provider="openrouter" />
    </div>
  );
}