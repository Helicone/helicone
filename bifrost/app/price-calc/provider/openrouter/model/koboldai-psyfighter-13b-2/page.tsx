"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function KoboldaiPsyfighter13b2PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="koboldai/psyfighter-13b-2" provider="openrouter" />
    </div>
  );
}