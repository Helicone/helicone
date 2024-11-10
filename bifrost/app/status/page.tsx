import { Metadata } from "next";
import { ProviderStatusPage } from "./ProviderStatusPage";

export const metadata: Metadata = {
  title: "AI Provider Status Dashboard - Helicone",
  description:
    "Live status monitoring for OpenAI, Anthropic, Mistral, and other major AI providers. Check current availability and performance of popular LLM APIs.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/status",
    title: "AI Provider Status Dashboard - Helicone",
    description:
      "Live status monitoring for OpenAI, Anthropic, Mistral, and other major AI providers. Check current availability and performance of popular LLM APIs.",
    images: "/static/status/status-open-graph.webp",
    locale: "en_US",
  },
  twitter: {
    title: "AI Provider Status Dashboard - Helicone",
    description:
      "Live status monitoring for OpenAI, Anthropic, Mistral, and other major AI providers. Check current availability and performance of popular LLM APIs.",
    card: "summary_large_image",
    images: "/static/status/status-open-graph.webp",
  },
};

export default function PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ProviderStatusPage provider="all" />
    </div>
  );
}
