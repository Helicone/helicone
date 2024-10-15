"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Claude3Opus20240229PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-3-opus-20240229" provider="anthropic" />
    </div>
  );
}