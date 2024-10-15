"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NousResearchNousHermes2Mixtral8x7BSFTPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT" provider="together" />
    </div>
  );
}