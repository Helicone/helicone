"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function DeepseekAiDeepseekCoder33bInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="deepseek-ai/deepseek-coder-33b-instruct" provider="together" />
    </div>
  );
}