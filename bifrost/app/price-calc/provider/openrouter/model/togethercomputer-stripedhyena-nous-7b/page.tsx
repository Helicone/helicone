"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function TogethercomputerStripedhyenaNous7bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="togethercomputer/stripedhyena-nous-7b" provider="openrouter" />
    </div>
  );
}