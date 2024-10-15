"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function JondurbinAiroborosL270bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="jondurbin/airoboros-l2-70b" provider="openrouter" />
    </div>
  );
}