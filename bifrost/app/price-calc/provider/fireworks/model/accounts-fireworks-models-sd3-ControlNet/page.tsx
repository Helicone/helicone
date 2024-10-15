"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AccountsFireworksModelsSd3ControlNetPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="accounts/fireworks/models/sd3-ControlNet" provider="fireworks" />
    </div>
  );
}