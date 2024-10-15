"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Gpt35Turbo0301PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gpt-3.5-turbo-0301" provider="openai" />
    </div>
  );
}