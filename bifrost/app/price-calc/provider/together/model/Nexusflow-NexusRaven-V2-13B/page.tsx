"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function NexusflowNexusRavenV213BPriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="Nexusflow/NexusRaven-V2-13B" provider="together" />
    </div>
  );
}