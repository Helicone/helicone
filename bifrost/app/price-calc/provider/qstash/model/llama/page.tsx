"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function LlamaPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="llama" provider="qstash" />
    </div>
  );
}