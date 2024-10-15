"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function SnowflakeSnowflakeArcticInstructPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="snowflake/snowflake-arctic-instruct" provider="openrouter" />
    </div>
  );
}