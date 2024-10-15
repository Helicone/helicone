"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AllenaiOlmo7bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="allenai/olmo-7b-instruct" provider="openrouter" />
    </div>
  );
}