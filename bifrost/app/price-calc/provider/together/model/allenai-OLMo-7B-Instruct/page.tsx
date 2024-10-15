"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function AllenaiOLMo7BInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="allenai/OLMo-7B-Instruct" provider="together" />
    </div>
  );
}