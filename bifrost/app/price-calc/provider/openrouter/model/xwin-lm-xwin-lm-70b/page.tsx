"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function XwinLmXwinLm70bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="xwin-lm/xwin-lm-70b" provider="openrouter" />
    </div>
  );
}