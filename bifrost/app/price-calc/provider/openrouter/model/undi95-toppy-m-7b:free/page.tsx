"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Undi95ToppyM7bfreePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="undi95/toppy-m-7b:free" provider="openrouter" />
    </div>
  );
}