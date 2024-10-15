"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Gemini10ProVision001PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gemini-1.0-pro-vision-001" provider="google" />
    </div>
  );
}