"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function JondurbinBagel34bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="jondurbin/bagel-34b" provider="openrouter" />
    </div>
  );
}