"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GrypheMythomist7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gryphe/mythomist-7b" provider="openrouter" />
    </div>
  );
}