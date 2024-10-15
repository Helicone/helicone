"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function UpstageSOLAR107BInstructV10PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="upstage/SOLAR-10.7B-Instruct-v1.0" provider="together" />
    </div>
  );
}