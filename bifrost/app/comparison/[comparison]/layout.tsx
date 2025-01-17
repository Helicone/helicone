import { providers } from "@/packages/cost/providers/mappings";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { comparison: string };
}): Promise<Metadata> {
  const [modelAWithProvider, modelBWithProvider] =
    params.comparison.split("-vs-");
  const [modelA, providerA] = modelAWithProvider.split("-on-");
  const [modelB, providerB] = modelBWithProvider.split("-on-");
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

const getDisplayName = (model: string, provider: string): string => {
  const providerInfo = providers.find(
    (p) => p.provider.toUpperCase() === provider.toUpperCase()
  );
  const modelDetails = providerInfo?.modelDetails;

  const details = modelDetails?.[model.toLowerCase()];

  if (details) {
    return details.searchTerms[0];
  }

  return model;
};

const getComparisonTitle = (
  modelA: string,
  modelB: string,
  providerA: string,
  providerB: string
) => {
  const modelADisplay = getDisplayName(modelA, providerA);
  const modelBDisplay = getDisplayName(modelB, providerB);
  return `${modelADisplay} vs ${modelBDisplay} - Model Comparison | Helicone`;
};

const getComparisonDescription = (
  modelA: string,
  modelB: string,
  providerA: string,
  providerB: string
) => {
  const modelADisplay = `${providerA}'s ${getDisplayName(modelA, providerA)}`;
  const modelBDisplay = `${providerB}'s ${getDisplayName(modelB, providerB)}`;
  return `Compare ${modelADisplay} and ${modelBDisplay}. Detailed analysis of performance metrics, costs, capabilities, and real-world usage patterns. Make data-driven decisions about which AI model best fits your needs.`;
};
