import { Metadata } from "next";
import { Suspense } from "react";
import { ModelDetailPage } from "./ModelDetailPage";
import { Layout } from "@/app/components/Layout";

export async function generateMetadata({
  params,
}: {
  params: { modelName: string };
}): Promise<Metadata> {
  const decodedModelName = decodeURIComponent(params.modelName);
  const displayName = decodedModelName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${displayName} - AI Model Details | Helicone`,
    description: `Explore ${displayName} specifications, pricing, capabilities, and provider options. Compare context length, costs, and supported features.`,
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      url: `https://www.helicone.ai/model/${params.modelName}`,
      title: `${displayName} - AI Model Details | Helicone`,
      description: `Explore ${displayName} specifications, pricing, capabilities, and provider options. Compare context length, costs, and supported features.`,
      images: "/static/models/models-open-graph.webp",
      locale: "en_US",
    },
    twitter: {
      title: `${displayName} - AI Model Details | Helicone`,
      description: `Explore ${displayName} specifications, pricing, capabilities, and provider options. Compare context length, costs, and supported features.`,
      card: "summary_large_image",
      images: "/static/models/models-open-graph.webp",
    },
  };
}

export default async function ModelPage({
  params,
}: {
  params: { modelName: string };
}) {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto px-4 py-8">
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
        <ModelDetailPage />
      </Suspense>
    </Layout>
  );
}