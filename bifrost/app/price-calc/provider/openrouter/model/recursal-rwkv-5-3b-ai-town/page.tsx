"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function RecursalRwkv53bAiTownPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="recursal/rwkv-5-3b-ai-town" provider="openrouter" />
    </div>
  );
}