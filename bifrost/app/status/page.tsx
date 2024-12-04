import { Metadata } from "next";
import { ProviderStatusPage } from "./ProviderStatusPage";
import { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "LLM Status Checker: Is OpenAI, Claude, or Perplexity Down? - Helicone",
  description:
    "Live status monitoring for OpenAI, Anthropic, Claude, Perplexity, Together AI, Mistral, and other major AI providers. Check current availability and performance of popular LLM APIs.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/status",
    title:
      "LLM Status Checker: Is OpenAI, Claude, or Perplexity Down? - Helicone",
    description:
      "Live status monitoring for OpenAI, Anthropic, Claude, Perplexity, Together AI, Mistral, and other major AI providers. Check current availability and performance of popular LLM APIs.",
    images: "/static/status/status-page-open-graph.webp",
    locale: "en_US",
  },
  twitter: {
    title:
      "LLM Status Checker: Is OpenAI, Claude, or Perplexity Down? - Helicone",
    description:
      "Live status monitoring for OpenAI, Anthropic, Claude, Perplexity, Together AI, Mistral, and other major AI providers. Check current availability and performance of popular LLM APIs.",
    card: "summary_large_image",
    images: "/static/status/status-page-open-graph.webp",
  },
};

export default function PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ProviderStatusPage provider="all" />
      </Suspense>
    </div>
  );
}
