"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AlpindaleGoliath120bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="alpindale/goliath-120b" provider="openrouter" />
    </div>
  );
}