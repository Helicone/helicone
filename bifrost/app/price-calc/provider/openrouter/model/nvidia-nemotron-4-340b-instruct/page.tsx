"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NvidiaNemotron4340bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="nvidia/nemotron-4-340b-instruct" provider="openrouter" />
    </div>
  );
}