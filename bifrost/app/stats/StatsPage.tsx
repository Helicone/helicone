"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, PieChart, Server } from "lucide-react";
import { ModelUsageChart } from "./ModelUsageChart";
import { ModelLeaderboard } from "./ModelLeaderboard";
import { MarketShareChart } from "./MarketShareChart";
import { MarketShareLeaderboard } from "./MarketShareLeaderboard";
import { ProviderUsageChart } from "./ProviderUsageChart";
import { ProviderLeaderboard } from "./ProviderLeaderboard";

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

interface ModelUsageResponse {
  timeSeries: TimeSeriesDataPoint[];
  leaderboard: LeaderboardEntry[];
}

interface AuthorTokens {
  author: string;
  totalTokens: number;
  percentage: number;
}

interface MarketShareTimeSeriesDataPoint {
  time: string;
  authors: AuthorTokens[];
}

interface MarketShareLeaderboardEntry {
  rank: number;
  author: string;
  totalTokens: number;
  marketShare: number;
  rankChange: number | null;
  marketShareChange: number | null;
}

interface MarketShareResponse {
  timeSeries: MarketShareTimeSeriesDataPoint[];
  leaderboard: MarketShareLeaderboardEntry[];
}

interface ProviderTokens {
  provider: string;
  totalTokens: number;
}

interface ProviderTimeSeriesDataPoint {
  time: string;
  providers: ProviderTokens[];
}

interface ProviderLeaderboardEntry {
  rank: number;
  provider: string;
  totalTokens: number;
  percentChange: number | null;
}

interface ProviderUsageResponse {
  timeSeries: ProviderTimeSeriesDataPoint[];
  leaderboard: ProviderLeaderboardEntry[];
}

const JAWN_BASE_URL =
  process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";

async function fetchStats<T>(endpoint: string, timeframe: string): Promise<T> {
  const response = await fetch(
    `${JAWN_BASE_URL}/v1/public/stats/${endpoint}?timeframe=${timeframe}`
  );
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data as T;
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

export function StatsPage() {
  const [leaderboardTimeframe, setLeaderboardTimeframe] =
    useState<LeaderboardTimeFrame>("7d");
  const [marketShareTimeframe, setMarketShareTimeframe] =
    useState<LeaderboardTimeFrame>("7d");
  const [providerTimeframe, setProviderTimeframe] =
    useState<LeaderboardTimeFrame>("7d");

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["model-usage-stats-chart"],
    queryFn: () => fetchStats<ModelUsageResponse>("model-usage", "1y"),
  });

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["model-usage-stats-leaderboard", leaderboardTimeframe],
    queryFn: () =>
      fetchStats<ModelUsageResponse>("model-usage", leaderboardTimeframe),
  });

  const { data: marketShareChartData, isLoading: marketShareChartLoading } =
    useQuery({
      queryKey: ["market-share-stats-chart"],
      queryFn: () => fetchStats<MarketShareResponse>("market-share", "1y"),
    });

  const {
    data: marketShareLeaderboardData,
    isLoading: marketShareLeaderboardLoading,
  } = useQuery({
    queryKey: ["market-share-stats-leaderboard", marketShareTimeframe],
    queryFn: () =>
      fetchStats<MarketShareResponse>("market-share", marketShareTimeframe),
  });

  const { data: providerChartData, isLoading: providerChartLoading } = useQuery(
    {
      queryKey: ["provider-usage-stats-chart"],
      queryFn: () => fetchStats<ProviderUsageResponse>("provider-usage", "1y"),
    }
  );

  const { data: providerLeaderboardData, isLoading: providerLeaderboardLoading } =
    useQuery({
      queryKey: ["provider-usage-stats-leaderboard", providerTimeframe],
      queryFn: () =>
        fetchStats<ProviderUsageResponse>("provider-usage", providerTimeframe),
    });

  return (
    <div className="bg-white dark:bg-black min-h-screen py-16 lg:py-16 w-[60%] mx-auto">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Leaderboard
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Usage across models on the Helicone AI Gateway
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

        <div className="py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Market Share
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Compare Helicone AI Gateway token share by model author
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 px-2 pt-8">
            <MarketShareChart
              data={marketShareChartData?.timeSeries ?? []}
              isLoading={marketShareChartLoading}
            />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Top Authors
              </h3>
              <TimeframeSelector
                value={marketShareTimeframe}
                onChange={setMarketShareTimeframe}
              />
            </div>
            <MarketShareLeaderboard
              data={marketShareLeaderboardData?.leaderboard ?? []}
              isLoading={marketShareLeaderboardLoading}
            />
          </div>
        </div>

        <div className="py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Inference Providers
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Compare Helicone AI Gateway token usage by inference provider
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 px-2 pt-8">
            <ProviderUsageChart
              data={providerChartData?.timeSeries ?? []}
              isLoading={providerChartLoading}
              timeframe="1y"
            />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Top Providers
              </h3>
              <TimeframeSelector
                value={providerTimeframe}
                onChange={setProviderTimeframe}
              />
            </div>
            <ProviderLeaderboard
              data={providerLeaderboardData?.leaderboard ?? []}
              isLoading={providerLeaderboardLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
