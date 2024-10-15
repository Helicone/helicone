"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AccountsFireworksModelsJapaneseStableDiffusionXlPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="accounts/fireworks/models/japanese-stable-diffusion-xl" provider="fireworks" />
    </div>
  );
}