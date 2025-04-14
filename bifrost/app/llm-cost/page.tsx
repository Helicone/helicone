import ModelPriceCalculator from "./ModelPriceCalculator";
import { Metadata } from "next";
// Import shared logic and types from utils.ts
import {
  getInitialCostData,
  getProviderWithModelsData,
  DEFAULT_INPUT_TOKENS,
  DEFAULT_OUTPUT_TOKENS,
  ProviderWithModels,
} from "./utils";

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

// Make the page component async
export default async function PriceCalcPage() {
  // Calculate initial data on the server
  const initialCostData = getInitialCostData();
  // Prepare filter data on the server
  const providerWithModels = getProviderWithModelsData(initialCostData);

  return (
    <div className="container mx-auto py-8">
      {/* Pass initial data AND filter data to the client component */}
      <ModelPriceCalculator
        initialCostData={initialCostData}
        defaultInputTokens={DEFAULT_INPUT_TOKENS}
        defaultOutputTokens={DEFAULT_OUTPUT_TOKENS}
        providerWithModels={providerWithModels}
      />
    </div>
  );
}
