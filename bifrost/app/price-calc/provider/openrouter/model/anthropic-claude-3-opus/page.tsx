"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AnthropicClaude3OpusPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="anthropic/claude-3-opus" provider="openrouter" />
    </div>
  );
}