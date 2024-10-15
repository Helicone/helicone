"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function DavinciPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="davinci" provider="azure" />
    </div>
  );
}