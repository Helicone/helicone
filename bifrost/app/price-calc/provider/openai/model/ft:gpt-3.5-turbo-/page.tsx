"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Ftgpt35TurboPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="ft:gpt-3.5-turbo-" provider="openai" />
    </div>
  );
}