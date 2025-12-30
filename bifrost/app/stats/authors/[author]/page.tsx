import { Metadata } from "next";
import { Layout } from "@/app/components/Layout";
import { Suspense } from "react";
import QueryProvider from "../../QueryProvider";
import { AuthorStatsPage } from "./AuthorStatsPage";
import { AUTHORS } from "@helicone-package/cost/models/types";

interface PageProps {
  params: Promise<{ author: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { author } = await params;
  const formattedAuthor = author
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${formattedAuthor} Model Stats - AI Gateway | Helicone`,
    description: `Real-time model usage statistics for ${formattedAuthor} models on the Helicone AI Gateway. View token usage trends and model leaderboards.`,
    openGraph: {
      title: `${formattedAuthor} Model Stats - AI Gateway | Helicone`,
      description: `Real-time model usage statistics for ${formattedAuthor} models on the Helicone AI Gateway.`,
    },
  };
}

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

export default async function AuthorPage({ params }: PageProps) {
  const { author } = await params;

  return (
    <Layout noNavbarMargin={true} hideFooter={true}>
      <Suspense fallback={<LoadingSkeleton />}>
        <QueryProvider>
          <AuthorStatsPage author={author} />
        </QueryProvider>
      </Suspense>
    </Layout>
  );
}

export async function generateStaticParams() {
  return AUTHORS.map((author) => ({
    author,
  }));
}
