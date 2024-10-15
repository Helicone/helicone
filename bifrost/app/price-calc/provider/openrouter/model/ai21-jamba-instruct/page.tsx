"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Ai21JambaInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="ai21/jamba-instruct" provider="openrouter" />
    </div>
  );
}