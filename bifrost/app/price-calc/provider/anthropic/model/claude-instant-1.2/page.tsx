"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function ClaudeInstant12PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-instant-1.2" provider="anthropic" />
    </div>
  );
}