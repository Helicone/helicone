"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Undi95RemmSlerpL213bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="undi95/remm-slerp-l2-13b" provider="openrouter" />
    </div>
  );
}