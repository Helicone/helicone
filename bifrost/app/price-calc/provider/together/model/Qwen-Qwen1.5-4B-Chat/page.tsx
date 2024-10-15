"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function QwenQwen154BChatPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Qwen/Qwen1.5-4B-Chat" provider="together" />
    </div>
  );
}