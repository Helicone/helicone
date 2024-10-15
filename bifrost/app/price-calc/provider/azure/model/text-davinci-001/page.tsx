"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TextDavinci001PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="text-davinci-001" provider="azure" />
    </div>
  );
}