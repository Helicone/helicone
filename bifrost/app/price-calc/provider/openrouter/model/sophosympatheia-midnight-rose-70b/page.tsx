"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function SophosympatheiaMidnightRose70bPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="sophosympatheia/midnight-rose-70b" provider="openrouter" />
    </div>
  );
}