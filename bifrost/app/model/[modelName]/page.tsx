import { Metadata } from "next";
import { Suspense } from "react";
import { ModelDetailPage } from "./ModelDetailPage";
import { Layout } from "@/app/components/Layout";
import { getJawnClient } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";
import QueryProvider from "@/app/stats/QueryProvider";

type ModelRegistryItem = components["schemas"]["ModelRegistryItem"];

// Revalidate every hour to keep data fresh
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const jawnClient = getJawnClient();
    const response = await jawnClient.GET("/v1/public/model-registry/models");
    
    if (response.data?.data?.models) {
      return response.data.data.models.map((model: ModelRegistryItem) => ({
        modelName: encodeURIComponent(model.id),
      }));
    }
  } catch (error) {
    console.error("Failed to generate static params for models:", error);
  }
  
  return [];
}

async function fetchModelData(modelId: string): Promise<ModelRegistryItem | null> {
  try {
    const jawnClient = getJawnClient();
    const response = await jawnClient.GET("/v1/public/model-registry/models");
    
    if (response.data?.data?.models) {
      const model = response.data.data.models.find(
        (m: ModelRegistryItem) => m.id === modelId
      );
      return model || null;
    }
  } catch (error) {
    console.error("Failed to fetch model data:", error);
  }
  
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { modelName: string };
}): Promise<Metadata> {
  const decodedModelName = decodeURIComponent(params.modelName);
  const model = await fetchModelData(decodedModelName);
  
  const displayName = model?.name || decodedModelName
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
  const decodedModelName = decodeURIComponent(params.modelName);
  const model = await fetchModelData(decodedModelName);
  
  return (
    <Layout noNavbarMargin={true}>
      <QueryProvider>
        <Suspense
          fallback={
            <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto px-4 py-8">
              <div className="h-8 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-96 bg-muted rounded animate-pulse" />
              <div className="grid gap-4 mt-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <ModelDetailPage initialModel={model} modelName={decodedModelName} />
        </Suspense>
      </QueryProvider>
    </Layout>
  );
}