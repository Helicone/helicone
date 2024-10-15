"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TextEmbeddingAda002V2PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="text-embedding-ada-002-v2" provider="azure" />
    </div>
  );
}