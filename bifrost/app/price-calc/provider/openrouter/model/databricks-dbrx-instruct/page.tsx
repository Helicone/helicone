"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function DatabricksDbrxInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="databricks/dbrx-instruct" provider="openrouter" />
    </div>
  );
}