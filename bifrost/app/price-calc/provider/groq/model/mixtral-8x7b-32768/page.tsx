"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Mixtral8x7b32768PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="mixtral-8x7b-32768" provider="groq" />
    </div>
  );
}