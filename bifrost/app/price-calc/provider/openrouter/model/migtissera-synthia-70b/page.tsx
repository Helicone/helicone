"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MigtisseraSynthia70bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="migtissera/synthia-70b" provider="openrouter" />
    </div>
  );
}