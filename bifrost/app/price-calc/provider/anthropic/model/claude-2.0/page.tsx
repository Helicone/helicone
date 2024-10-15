"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Claude20PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-2.0" provider="anthropic" />
    </div>
  );
}