import { formatProviderName } from "@/app/llm-cost/CalculatorInfo";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: {
    model: string;
    provider: string;
  };
}): Promise<Metadata> {
  const { model, provider } = params;
  const decodedModel = decodeURIComponent(model || "");
  const decodedProvider = formatProviderName(
    decodeURIComponent(provider || "")
  );

  const title = `${decodedProvider} ${decodedModel} Pricing Calculator | API Cost Estimation`;
  const description = `Explore AI costs with our comprehensive ${decodedProvider} ${decodedModel} Pricing Calculator. Compare prices for 300+ models across 10+ providers, get accurate API pricing, token costs, and budget estimations.`;

  const imageUrl = "/static/pricing-calc/calculator-open-graph.webp";

  return {
    title,
    description,
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      url: `https://www.helicone.ai/llm-cost/provider/${provider}/model/${model}`,
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
