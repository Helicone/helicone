"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function Llama3Groq70b8192ToolUsePreviewPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="llama3-groq-70b-8192-tool-use-preview" provider="groq" />
    </div>
  );
}