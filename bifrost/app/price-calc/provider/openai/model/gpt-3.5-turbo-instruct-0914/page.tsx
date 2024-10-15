"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Gpt35TurboInstruct0914PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gpt-3.5-turbo-instruct-0914" provider="openai" />
    </div>
  );
}