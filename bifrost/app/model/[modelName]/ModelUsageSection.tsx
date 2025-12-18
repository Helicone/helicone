"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { SingleUsageChart, SingleUsageDataPoint } from "@/app/stats/components/SingleUsageChart";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelStatsResponse {
  model: string;
  totalTokens: number;
  timeSeries: SingleUsageDataPoint[];
}

const JAWN_BASE_URL =
  process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";

async function fetchModelStats(model: string): Promise<ModelStatsResponse> {
  const response = await fetch(
    `${JAWN_BASE_URL}/v1/public/stats/models/${encodeURIComponent(model)}?timeframe=1y`
  );
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data as ModelStatsResponse;
}

interface ModelUsageSectionProps {
  modelId: string;
}

export function ModelUsageSection({ modelId }: ModelUsageSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["model-stats", modelId],
    queryFn: () => fetchModelStats(modelId),
  });

  if (isLoading) {
    return (
      <div className="pt-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!data?.timeSeries?.length) {
    return null;
  }

  return (
    <div className="pt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Usage
      </h2>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Token usage over the last year
        </p>
        <Link
          href="/stats"
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          View all stats
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="ml-2 mr-4">
        <SingleUsageChart
          data={data.timeSeries}
          isLoading={false}
          timeframe="1y"
          height={200}
        />
      </div>
    </div>
  );
}
