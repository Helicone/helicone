"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GoogleGeminiProPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="google/gemini-pro" provider="openrouter" />
    </div>
  );
}