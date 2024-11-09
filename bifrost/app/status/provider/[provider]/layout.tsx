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

  const title = `${decodedProvider} ${decodedModel} Status - Helicone`;
  const description = `Live status monitoring for ${decodedProvider} ${decodedModel}. Track API availability, latency, and performance metrics in real-time.`;

  const imageUrl = "/static/status/status-open-graph.webp";

  return {
    title,
    description,
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      url: `https://www.helicone.ai/status/provider/${provider}/model/${model}`,
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
