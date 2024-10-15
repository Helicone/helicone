"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GoogleGeminiPro15PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="google/gemini-pro-1.5" provider="openrouter" />
    </div>
  );
}