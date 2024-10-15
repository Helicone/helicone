"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function RwkvRwkv5World3bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="rwkv/rwkv-5-world-3b" provider="openrouter" />
    </div>
  );
}