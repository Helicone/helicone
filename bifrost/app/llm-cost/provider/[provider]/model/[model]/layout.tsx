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
  const decodedProvider = decodeURIComponent(provider || "");

  const title = `${decodedProvider} ${decodedModel} Pricing Calculator | API Cost Estimation`;
  const description = `Discover the cost of AI with our ${decodedProvider} ${decodedModel} Pricing Calculator. Get accurate API pricing, token costs, and budget estimation for ${decodedModel}. Compare ${decodedProvider} models.`;
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