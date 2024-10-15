"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AllenaiOLMo7BTwin2TPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="allenai/OLMo-7B-Twin-2T" provider="together" />
    </div>
  );
}