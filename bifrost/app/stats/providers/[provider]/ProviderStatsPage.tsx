// The public stats endpoints were removed in #5638 ("remove unauthenticated
// endpoints that run SQL"). This page depended on /v1/public/stats/* which no
// longer exist, which broke the bifrost production build and blocked all
// bifrost deploys for ~2 months. Until the stats endpoints are reintroduced
// securely, this renders a static unavailable state so the build stays green.
// To restore: see this file's git history before this commit.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ProviderStatsPageProps {
  provider: string;
}

export function ProviderStatsPage({ provider }: ProviderStatsPageProps) {
  const formattedProvider = provider
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 lg:px-6 py-4">
          <Link
            href="/stats"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to stats
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {formattedProvider} Provider Stats
          </h1>
        </div>
      </div>
      <div className="px-4 lg:px-6 py-16 flex flex-col items-center justify-center text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          Stats are temporarily unavailable.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md">
          We are reworking how these numbers are served. Check back soon.
        </p>
      </div>
    </div>
  );
}
