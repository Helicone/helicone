"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function SnorkelaiSnorkelMistralPairRMDPOPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="snorkelai/Snorkel-Mistral-PairRM-DPO" provider="together" />
    </div>
  );
}