"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function LiuhaotianLlavaYi34bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="liuhaotian/llava-yi-34b" provider="openrouter" />
    </div>
  );
}