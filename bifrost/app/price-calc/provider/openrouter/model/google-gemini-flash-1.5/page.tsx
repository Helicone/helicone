"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GoogleGeminiFlash15PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="google/gemini-flash-1.5" provider="openrouter" />
    </div>
  );
}