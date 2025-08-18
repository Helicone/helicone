import { Metadata } from "next";
import { ModelRegistryPage } from "./ModelRegistryPage";
import { Suspense } from "react";
import { Layout } from "@/app/components/Layout";

export const metadata: Metadata = {
  title: "AI Model Registry - Compare LLM Costs & Providers | Helicone",
  description:
    "Explore 500+ AI models across OpenAI, Anthropic, Google, Meta, and more. Compare costs, context windows, and providers for GPT-4, Claude, Gemini, and other LLMs.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/models",
    title: "AI Model Registry - Compare LLM Costs & Providers | Helicone",
    description:
      "Explore 500+ AI models across OpenAI, Anthropic, Google, Meta, and more. Compare costs, context windows, and providers for GPT-4, Claude, Gemini, and other LLMs.",
    images: "/static/models/models-open-graph.webp",
    locale: "en_US",
  },
  twitter: {
    title: "AI Model Registry - Compare LLM Costs & Providers | Helicone",
    description:
      "Explore 500+ AI models across OpenAI, Anthropic, Google, Meta, and more. Compare costs, context windows, and providers for GPT-4, Claude, Gemini, and other LLMs.",
    card: "summary_large_image",
    images: "/static/models/models-open-graph.webp",
  },
};

export default async function ModelsPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid gap-4 mt-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        }
      >
        <ModelRegistryPage />
      </Suspense>
    </Layout>
  );
}