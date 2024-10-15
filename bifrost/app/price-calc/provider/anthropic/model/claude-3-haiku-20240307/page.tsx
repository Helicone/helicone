"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Claude3Haiku20240307PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-3-haiku-20240307" provider="anthropic" />
    </div>
  );
}