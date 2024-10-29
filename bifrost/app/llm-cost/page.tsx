import ModelPriceCalculator from "./ModelPriceCalculator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LLM API Pricing Calculator | Compare 300+ AI Model Costs",
  description:
    "LLM cost comparison tool to estimate costs for 300+ models across 10+ providers, including OpenAI, Anthropic, Mistral, Claude, and more.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/llm-cost",
    title: "LLM API Pricing Calculator | Compare 300+ AI Model Costs",
    description:
      "LLM cost comparison tool to estimate costs for 300+ models across 10+ providers, including OpenAI, Anthropic, Mistral, Claude, and more.",
    images: "/static/pricing-calc/calculator-open-graph.webp",
    locale: "en_US",
  },
  twitter: {
    title: "LLM API Pricing Calculator | Compare 300+ AI Model Costs",
    description:
      "LLM cost comparison tool to estimate costs for 300+ models across 10+ providers, including OpenAI, Anthropic, Mistral, Claude, and more.",
    card: "summary_large_image",
    images: "/static/pricing-calc/calculator-open-graph.webp",
  },
};

export default function PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator />
    </div>
  );
}
