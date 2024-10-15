"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GooglePalm2CodechatBison32kPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="google/palm-2-codechat-bison-32k" provider="openrouter" />
    </div>
  );
}