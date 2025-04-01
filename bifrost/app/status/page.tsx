import { Metadata } from "next";
import { ProviderStatusPage } from "./ProviderStatusPage";
import { Suspense } from "react";
import { ProvidersTableSkeleton } from "./SkeletonLoaders";

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
      <Suspense
        fallback={
          <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    Pro Tip
                  </div>
                  <p className="text-gray-600">
                    Want advanced LLM monitoring and reliability tools?
                    <a
                      href="/signup"
                      className="text-blue-600 font-medium hover:text-blue-700 ml-2"
                    >
                      Get started for free →
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="container mx-auto py-8">
              <h2 className="text-2xl font-bold mb-4">All Providers</h2>
              <ProvidersTableSkeleton />
            </div>

            <i className="text-sm text-gray-500">
              Lightning speeds powered by{" "}
              <a
                href="https://clickhouse.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Clickhouse Cloud
              </a>
            </i>
          </div>
        }
      >
        <ProviderStatusPage provider="all" />
      </Suspense>
    </div>
  );
}
