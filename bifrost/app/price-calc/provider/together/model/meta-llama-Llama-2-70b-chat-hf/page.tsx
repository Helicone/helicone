"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function MetaLlamaLlama270bChatHfPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="meta-llama/Llama-2-70b-chat-hf" provider="together" />
    </div>
  );
}