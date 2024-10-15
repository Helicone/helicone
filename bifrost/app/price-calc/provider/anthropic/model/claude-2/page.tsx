"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Claude2PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-2" provider="anthropic" />
    </div>
  );
}