import { formatProviderName } from "@/app/llm-cost/CalculatorInfo";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: {
    modelA: string;
    modelB: string;
    providerA: string;
    providerB: string;
  };
}): Promise<Metadata> {
  const { modelA, modelB, providerA, providerB } = params;
  const decodedModelA = decodeURIComponent(modelA || "");
  const decodedModelB = decodeURIComponent(modelB || "");
  const decodedProviderA = decodeURIComponent(providerA || "");
  const decodedProviderB = decodeURIComponent(providerB || "");

  const title = getComparisonTitle(
    decodedModelA,
    decodedModelB,
    decodedProviderA,
    decodedProviderB
  );
  const description = getComparisonDescription(
    decodedModelA,
    decodedModelB,
    decodedProviderA,
    decodedProviderB
  );
  const imageUrl = "/static/status/status-page-open-graph.webp";

  return {
    title,
    description,
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      url: `https://www.helicone.ai/comparison/${modelA}-vs-${modelB}`,
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

const getComparisonTitle = (
  modelA: string,
  modelB: string,
  providerA: string,
  providerB: string
) => {
  const modelADisplay = `${providerA}'s ${modelA}`;
  const modelBDisplay = `${providerB}'s ${modelB}`;
  return `${modelADisplay} vs ${modelBDisplay} - Model Comparison & Performance Analysis - Helicone`;
};

const getComparisonDescription = (
  modelA: string,
  modelB: string,
  providerA: string,
  providerB: string
) => {
  const modelADisplay = `${providerA}'s ${modelA}`;
  const modelBDisplay = `${providerB}'s ${modelB}`;
  return `Compare ${modelADisplay} and ${modelBDisplay}. Detailed analysis of performance metrics, costs, capabilities, and real-world usage patterns. Make data-driven decisions about which AI model best fits your needs.`;
};
