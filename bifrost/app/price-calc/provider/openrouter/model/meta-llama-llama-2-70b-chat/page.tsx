"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaLlama270bChatPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/llama-2-70b-chat" provider="openrouter" />
    </div>
  );
}