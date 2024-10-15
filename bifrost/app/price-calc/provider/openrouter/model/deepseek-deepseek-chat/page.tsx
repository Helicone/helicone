"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function DeepseekDeepseekChatPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="deepseek/deepseek-chat" provider="openrouter" />
    </div>
  );
}