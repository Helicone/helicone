"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AnthropicClaude3HaikuPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="anthropic/claude-3-haiku" provider="openrouter" />
    </div>
  );
}