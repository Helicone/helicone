"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AccountsFireworksModelsSd3TurboPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="accounts/fireworks/models/sd3-turbo" provider="fireworks" />
    </div>
  );
}