"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GeminiProPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gemini-pro" provider="google" />
    </div>
  );
}