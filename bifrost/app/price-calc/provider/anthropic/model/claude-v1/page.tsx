"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function ClaudeV1PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="claude-v1" provider="anthropic" />
    </div>
  );
}