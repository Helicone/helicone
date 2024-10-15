"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TogethercomputerRedPajamaINCITE7BBasePriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="togethercomputer/RedPajama-INCITE-7B-Base" provider="together" />
    </div>
  );
}