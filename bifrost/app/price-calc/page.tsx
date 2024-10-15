import ModelPriceCalculator from "./ModelPriceCalculator";

export default function PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="gpt-4o" provider="OpenAI" />
    </div>
  );
}
