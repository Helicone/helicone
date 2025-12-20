"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, PieChart, Server } from "lucide-react";
import { ModelUsageChart } from "./ModelUsageChart";
import { ModelLeaderboard } from "./ModelLeaderboard";
import { MarketShareChart } from "./MarketShareChart";
import { MarketShareLeaderboard } from "./MarketShareLeaderboard";
import { ProviderUsageChart } from "./ProviderUsageChart";
import { ProviderLeaderboard } from "./ProviderLeaderboard";
import { getJawnClient } from "@/lib/clients/jawn";

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
  const jawnClient = useMemo(() => getJawnClient(), []);
  
  const [leaderboardTimeframe, setLeaderboardTimeframe] =
    useState<LeaderboardTimeFrame>("7d");
  const [marketShareTimeframe, setMarketShareTimeframe] =
    useState<LeaderboardTimeFrame>("7d");
  const [providerTimeframe, setProviderTimeframe] =
    useState<LeaderboardTimeFrame>("7d");

  // Model usage chart data
  const [chartData, setChartData] = useState<ModelUsageResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(true);

  // Model usage leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<ModelUsageResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Market share chart data
  const [marketShareChartData, setMarketShareChartData] = useState<MarketShareResponse | null>(null);
  const [marketShareChartLoading, setMarketShareChartLoading] = useState(true);

  // Market share leaderboard data
  const [marketShareLeaderboardData, setMarketShareLeaderboardData] = useState<MarketShareResponse | null>(null);
  const [marketShareLeaderboardLoading, setMarketShareLeaderboardLoading] = useState(false);

  // Provider chart data
  const [providerChartData, setProviderChartData] = useState<ProviderUsageResponse | null>(null);
  const [providerChartLoading, setProviderChartLoading] = useState(true);

  // Provider leaderboard data
  const [providerLeaderboardData, setProviderLeaderboardData] = useState<ProviderUsageResponse | null>(null);
  const [providerLeaderboardLoading, setProviderLeaderboardLoading] = useState(false);

  // Fetch model usage chart (1 year) on mount
  useEffect(() => {
    const fetchModelUsageChart = async () => {
      try {
        setChartLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/model-usage",
          { params: { query: { timeframe: "1y" } } }
        );
        if (response.data?.data) {
          setChartData(response.data.data as ModelUsageResponse);
        }
      } catch (error) {
        console.error("Failed to load model usage chart:", error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchModelUsageChart();
  }, [jawnClient]);

  // Fetch model usage leaderboard
  useEffect(() => {
    const fetchModelUsageLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/model-usage",
          { params: { query: { timeframe: leaderboardTimeframe } } }
        );
        if (response.data?.data) {
          setLeaderboardData(response.data.data as ModelUsageResponse);
        }
      } catch (error) {
        console.error("Failed to load model usage leaderboard:", error);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchModelUsageLeaderboard();
  }, [leaderboardTimeframe, jawnClient]);

  // Fetch market share chart (1 year) on mount
  useEffect(() => {
    const fetchMarketShareChart = async () => {
      try {
        setMarketShareChartLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/market-share",
          { params: { query: { timeframe: "1y" } } }
        );
        if (response.data?.data) {
          setMarketShareChartData(response.data.data as MarketShareResponse);
        }
      } catch (error) {
        console.error("Failed to load market share chart:", error);
      } finally {
        setMarketShareChartLoading(false);
      }
    };

    fetchMarketShareChart();
  }, [jawnClient]);

  // Fetch market share leaderboard
  useEffect(() => {
    const fetchMarketShareLeaderboard = async () => {
      try {
        setMarketShareLeaderboardLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/market-share",
          { params: { query: { timeframe: marketShareTimeframe } } }
        );
        if (response.data?.data) {
          setMarketShareLeaderboardData(response.data.data as MarketShareResponse);
        }
      } catch (error) {
        console.error("Failed to load market share leaderboard:", error);
      } finally {
        setMarketShareLeaderboardLoading(false);
      }
    };

    fetchMarketShareLeaderboard();
  }, [marketShareTimeframe, jawnClient]);

  // Fetch provider usage chart (1 year) on mount
  useEffect(() => {
    const fetchProviderUsageChart = async () => {
      try {
        setProviderChartLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/provider-usage",
          { params: { query: { timeframe: "1y" } } }
        );
        if (response.data?.data) {
          setProviderChartData(response.data.data as ProviderUsageResponse);
        }
      } catch (error) {
        console.error("Failed to load provider usage chart:", error);
      } finally {
        setProviderChartLoading(false);
      }
    };

    fetchProviderUsageChart();
  }, [jawnClient]);

  // Fetch provider usage leaderboard
  useEffect(() => {
    const fetchProviderUsageLeaderboard = async () => {
      try {
        setProviderLeaderboardLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/provider-usage",
          { params: { query: { timeframe: providerTimeframe } } }
        );
        if (response.data?.data) {
          setProviderLeaderboardData(response.data.data as ProviderUsageResponse);
        }
      } catch (error) {
        console.error("Failed to load provider usage leaderboard:", error);
      } finally {
        setProviderLeaderboardLoading(false);
      }
    };

    fetchProviderUsageLeaderboard();
  }, [providerTimeframe, jawnClient]);

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
