import { formatProviderName } from "@/app/llm-cost/CalculatorInfo";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: {
    provider: string;
  };
}): Promise<Metadata> {
  const { provider } = params;
  const decodedProvider = formatProviderName(
    decodeURIComponent(provider || "")
  );

  const title = getProviderTitle(decodedProvider);
  const description = getProviderDescription(decodedProvider);
  const imageUrl = "/static/status/status-page-open-graph.webp";

  return {
    title,
    description,
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      url: `https://www.helicone.ai/status/provider/${provider}`,
      title,
      description,
      images: imageUrl,
      locale: "en_US",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: imageUrl,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

const getProviderTitle = (provider: string) => {
  if (provider.toLowerCase() === "anthropic") {
    return "Is Claude Down? Live Status & Performance Monitor - Helicone";
  }

  return `Is ${provider} Down? Live Status & Performance Monitor - Helicone`;
};

const getProviderDescription = (provider: string) => {
  if (provider.toLowerCase() === "anthropic") {
    return `Check if Claude or Anthropic API is working. Live status monitoring, current outages, API availability, and performance metrics for Claude 3.5 Sonnet, Claude 3 Opus, Claude 2.1, and Claude Instant. Real-time Anthropic system status.`;
  }
  if (provider.toLowerCase() === "openai") {
    return `Check if ChatGPT or OpenAI API is working. Live status monitoring, current outages, and performance metrics for GPT-4o, GPT-4o-mini, o1-preview, o1-mini, and DALL-E. Real-time OpenAI system status.`;
  }
  return `Real-time ${provider} status checker. Monitor API availability, response times, and error rates. Track ${provider} performance metrics and service reliability with live data.`;
};
