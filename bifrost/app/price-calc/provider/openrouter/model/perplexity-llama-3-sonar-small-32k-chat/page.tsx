"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function PerplexityLlama3SonarSmall32kChatPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="perplexity/llama-3-sonar-small-32k-chat" provider="openrouter" />
    </div>
  );
}