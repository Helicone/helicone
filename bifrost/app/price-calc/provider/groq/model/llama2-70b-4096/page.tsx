"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Llama270b4096PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="llama2-70b-4096" provider="groq" />
    </div>
  );
}