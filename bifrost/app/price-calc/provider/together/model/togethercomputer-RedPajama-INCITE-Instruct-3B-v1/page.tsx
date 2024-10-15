"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TogethercomputerRedPajamaINCITEInstruct3BV1PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="togethercomputer/RedPajama-INCITE-Instruct-3B-v1" provider="together" />
    </div>
  );
}