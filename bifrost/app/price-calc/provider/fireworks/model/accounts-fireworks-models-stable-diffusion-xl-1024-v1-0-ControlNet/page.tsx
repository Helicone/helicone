"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AccountsFireworksModelsStableDiffusionXl1024V10ControlNetPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="accounts/fireworks/models/stable-diffusion-xl-1024-v1-0-ControlNet" provider="fireworks" />
    </div>
  );
}