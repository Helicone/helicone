"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Server } from "lucide-react";
import { ModelUsageChart } from "../../ModelUsageChart";
import { ModelLeaderboard } from "../../ModelLeaderboard";

type LeaderboardTimeFrame = "24h" | "7d" | "30d";

const LEADERBOARD_TIME_OPTIONS: {
  value: LeaderboardTimeFrame;
  label: string;
}[] = [
  { value: "24h", label: "Today" },
  { value: "7d", label: "This Week" },
  { value: "30d", label: "This Month" },
];

interface ModelTokens {
  model: string;
  totalTokens: number;
}

interface TimeSeriesDataPoint {
  time: string;
  models: ModelTokens[];
}

interface LeaderboardEntry {
  rank: number;
  model: string;
  author: string;
  totalTokens: number;
  percentChange: number | null;
}

interface ProviderStatsResponse {
  provider: string;
  totalTokens: number;
  timeSeries: TimeSeriesDataPoint[];
  leaderboard: LeaderboardEntry[];
}

const JAWN_BASE_URL =
  process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";

async function fetchProviderStats(
  provider: string,
  timeframe: string
): Promise<ProviderStatsResponse> {
  const response = await fetch(
    `${JAWN_BASE_URL}/v1/public/stats/providers/${encodeURIComponent(provider)}?timeframe=${timeframe}`
  );
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data as ProviderStatsResponse;
}

function TimeframeSelector({
  value,
  onChange,
}: {
  value: LeaderboardTimeFrame;
  onChange: (value: LeaderboardTimeFrame) => void;
}) {
  return (
    <div className="flex gap-2">
      {LEADERBOARD_TIME_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-md text-sm ${
            value === option.value
              ? "bg-brand text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ProviderStatsPageProps {
  provider: string;
}

export function ProviderStatsPage({ provider }: ProviderStatsPageProps) {
  const [leaderboardTimeframe, setLeaderboardTimeframe] =
    useState<LeaderboardTimeFrame>("7d");

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["provider-stats-chart", provider],
    queryFn: () => fetchProviderStats(provider, "1y"),
  });

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["provider-stats-leaderboard", provider, leaderboardTimeframe],
    queryFn: () => fetchProviderStats(provider, leaderboardTimeframe),
  });

  return (
    <div className="bg-white dark:bg-black min-h-screen py-16 lg:py-16 w-[60%] mx-auto">
      <div className="px-4 lg:px-6 py-4">
        <Link
          href="/stats"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Stats
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {provider}
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Model usage through {provider} on the Helicone AI Gateway
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="border border-gray-200 dark:border-gray-800 px-2 pt-8">
          <ModelUsageChart
            data={chartData?.timeSeries ?? []}
            isLoading={chartLoading}
            timeframe="1y"
          />
        </div>

        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Models
            </h2>
            <TimeframeSelector
              value={leaderboardTimeframe}
              onChange={setLeaderboardTimeframe}
            />
          </div>
          <ModelLeaderboard
            data={leaderboardData?.leaderboard ?? []}
            isLoading={leaderboardLoading}
          />
        </div>
      </div>
    </div>
  );
}
