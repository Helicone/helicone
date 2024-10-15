"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function GarageBAIndPlatypus270BInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="garage-bAInd/Platypus2-70B-instruct" provider="together" />
    </div>
  );
}