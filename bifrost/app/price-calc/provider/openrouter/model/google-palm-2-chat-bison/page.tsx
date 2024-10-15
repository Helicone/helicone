"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GooglePalm2ChatBisonPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="google/palm-2-chat-bison" provider="openrouter" />
    </div>
  );
}