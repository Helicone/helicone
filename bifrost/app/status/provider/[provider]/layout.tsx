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

  const title = `${decodedProvider} Status - Helicone`;
  const description = `Live status monitoring for ${decodedProvider}. Track API availability, latency, and performance metrics in real-time.`;

  const imageUrl = "/static/status/status-open-graph.webp";

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
