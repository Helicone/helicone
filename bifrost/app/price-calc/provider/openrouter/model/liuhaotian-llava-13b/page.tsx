"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function LiuhaotianLlava13bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="liuhaotian/llava-13b" provider="openrouter" />
    </div>
  );
}