"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Undi95ReMMSLERPL213BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Undi95/ReMM-SLERP-L2-13B" provider="together" />
    </div>
  );
}