"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AnthropicClaude20PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="anthropic/claude-2.0" provider="openrouter" />
    </div>
  );
}