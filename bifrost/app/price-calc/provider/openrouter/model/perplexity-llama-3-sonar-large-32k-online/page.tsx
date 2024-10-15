"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function PerplexityLlama3SonarLarge32kOnlinePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="perplexity/llama-3-sonar-large-32k-online" provider="openrouter" />
    </div>
  );
}