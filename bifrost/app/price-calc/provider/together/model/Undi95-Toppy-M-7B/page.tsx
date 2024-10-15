"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Undi95ToppyM7BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Undi95/Toppy-M-7B" provider="together" />
    </div>
  );
}