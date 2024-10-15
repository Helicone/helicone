"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TextDavinci002PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="text-davinci-002" provider="azure" />
    </div>
  );
}