"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Gpt41106PreviewPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gpt-4-1106-preview" provider="openai" />
    </div>
  );
}