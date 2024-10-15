"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AccountsFireworksModelsJapaneseStableDiffusionXlControlNetPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="accounts/fireworks/models/japanese-stable-diffusion-xl-ControlNet" provider="fireworks" />
    </div>
  );
}