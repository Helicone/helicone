"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Huggingfaceh4Zephyr7bBetaPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="huggingfaceh4/zephyr-7b-beta" provider="openrouter" />
    </div>
  );
}