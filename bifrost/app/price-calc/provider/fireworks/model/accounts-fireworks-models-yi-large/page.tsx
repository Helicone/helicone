"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AccountsFireworksModelsYiLargePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="accounts/fireworks/models/yi-large" provider="fireworks" />
    </div>
  );
}