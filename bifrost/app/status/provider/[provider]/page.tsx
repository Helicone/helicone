import { ProviderStatusPage } from "@/app/status/ProviderStatusPage";
import { providers } from "@/packages/cost/providers/mappings";

export default async function Home({
  params,
}: {
  params: {
    provider?: string;
  };
}) {
  const { provider } = params;
  const decodedProvider = decodeURIComponent(provider || "");

  return (
    <div className="container mx-auto py-8">
      <ProviderStatusPage provider={decodedProvider} />
    </div>
  );
}

export async function generateStaticParams() {
  const paths = [];

  for (const provider of providers) {
    paths.push({
      provider: encodeURIComponent(provider.provider.toLowerCase()),
    });
  }

  return paths;
}
