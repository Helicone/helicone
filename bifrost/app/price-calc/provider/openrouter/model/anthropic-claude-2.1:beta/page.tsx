"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AnthropicClaude21betaPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="anthropic/claude-2.1:beta" provider="openrouter" />
    </div>
  );
}