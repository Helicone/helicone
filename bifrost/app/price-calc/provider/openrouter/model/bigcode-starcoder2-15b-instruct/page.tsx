"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function BigcodeStarcoder215bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="bigcode/starcoder2-15b-instruct" provider="openrouter" />
    </div>
  );
}