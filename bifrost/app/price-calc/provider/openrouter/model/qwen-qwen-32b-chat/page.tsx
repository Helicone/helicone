"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function QwenQwen32bChatPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="qwen/qwen-32b-chat" provider="openrouter" />
    </div>
  );
}