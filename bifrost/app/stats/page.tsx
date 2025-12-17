import { Metadata } from "next";
import { StatsPage } from "./StatsPage";
import QueryProvider from "./QueryProvider";
import { Layout } from "@/app/components/Layout";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Model Leaderboard - AI Gateway Stats | Helicone",
  description:
    "Real-time model usage statistics from the Helicone AI Gateway. View token usage trends and model leaderboards.",
  openGraph: {
    title: "Model Leaderboard - AI Gateway Stats | Helicone",
    description:
      "Real-time model usage statistics from the Helicone AI Gateway.",
  },
};

function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 lg:px-6 py-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
        </div>
      </div>
      <div className="px-4 lg:px-6 py-8">
        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function Stats() {
  return (
    <Layout noNavbarMargin={true} hideFooter={true}>
      <Suspense fallback={<LoadingSkeleton />}>
        <QueryProvider>
          <StatsPage />
        </QueryProvider>
      </Suspense>
    </Layout>
  );
}
