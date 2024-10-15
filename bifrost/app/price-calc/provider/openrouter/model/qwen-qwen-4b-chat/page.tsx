"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function QwenQwen4bChatPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="qwen/qwen-4b-chat" provider="openrouter" />
    </div>
  );
}