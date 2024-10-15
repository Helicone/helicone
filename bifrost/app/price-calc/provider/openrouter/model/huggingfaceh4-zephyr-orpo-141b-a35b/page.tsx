"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Huggingfaceh4ZephyrOrpo141bA35bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="huggingfaceh4/zephyr-orpo-141b-a35b" provider="openrouter" />
    </div>
  );
}