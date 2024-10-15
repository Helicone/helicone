"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Llama370b8192PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="llama3-70b-8192" provider="groq" />
    </div>
  );
}