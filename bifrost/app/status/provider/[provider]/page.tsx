import { ProviderStatusPage } from "@/app/status/ProviderStatusPage";
import { providers } from "@/packages/cost/providers/mappings";

const displayToBackendName: Record<string, string> = {
  "Together AI": "TOGETHER",
};

export default async function Home({
  params,
}: {
  params: {
    provider?: string;
  };
}) {
  const { provider } = params;
  const decodedProvider = decodeURIComponent(provider || "");

  const backendProvider =
    displayToBackendName[decodedProvider] || decodedProvider;

  return (
    <div className="container mx-auto py-8">
      <ProviderStatusPage provider={backendProvider} />
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
