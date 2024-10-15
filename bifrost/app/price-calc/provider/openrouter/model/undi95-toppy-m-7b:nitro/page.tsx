"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Undi95ToppyM7bnitroPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="undi95/toppy-m-7b:nitro" provider="openrouter" />
    </div>
  );
}