"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Claude35Sonnet20240620PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-3-5-sonnet-20240620" provider="anthropic" />
    </div>
  );
}