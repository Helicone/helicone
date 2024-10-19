export async function generateMetadata({
  params,
}: {
  params: {
    model: string;
    provider: string;
  };
}) {
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
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
    },
    authors: [{ name: "Helicone Team" }],
    other: {
      timeToRead: "3 minutes",
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

function formatProviderName(provider: string): string {
  const formattingMap: { [key: string]: string } = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure",
    TOGETHER: "Together AI",
    FIREWORKS: "Fireworks",
    OPENROUTER: "OpenRouter",
    GROQ: "Groq",
    QSTASH: "Qstash",
    MISTRAL: "Mistral",
  };

  return formattingMap[provider.toUpperCase()] || provider.toUpperCase();
}
