"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Server } from "lucide-react";
import { ModelUsageChart } from "../../ModelUsageChart";
import { ModelLeaderboard } from "../../ModelLeaderboard";
import { getJawnClient } from "@/lib/clients/jawn";
import { UptimeStatusBar, UptimeDataPoint } from "@/components/stats/UptimeStatusBar";

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
  const jawnClient = useMemo(() => getJawnClient(), []);
  const [leaderboardTimeframe, setLeaderboardTimeframe] =
    useState<LeaderboardTimeFrame>("7d");

  // Chart data
  const [chartData, setChartData] = useState<ProviderStatsResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(true);

  // Leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<ProviderStatsResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Uptime data
  const [uptimeData, setUptimeData] = useState<UptimeDataPoint[]>([]);
  const [uptimeLoading, setUptimeLoading] = useState(true);
  const [overallUptime, setOverallUptime] = useState<number | null>(null);

  // Fetch uptime data (1 year) on mount
  // Note: Using direct fetch until types are regenerated
  useEffect(() => {
    const fetchUptimeData = async () => {
      try {
        setUptimeLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";
        const response = await fetch(
          `${baseUrl}/v1/public/stats/providers/${encodeURIComponent(provider)}/uptime?timeframe=1y`
        );
        const result = await response.json();

        if (result.data) {
          setUptimeData(result.data.uptime as UptimeDataPoint[]);
          setOverallUptime(result.data.overallSuccessRate);
        }
      } catch (error) {
        console.error("Failed to load provider uptime:", error);
      } finally {
        setUptimeLoading(false);
      }
    };

    fetchUptimeData();
  }, [provider]);

  // Fetch chart data (1 year) on mount
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/providers/{provider}",
          {
            params: { path: { provider }, query: { timeframe: "1y" } },
          }
        );

        if (response.data?.data) {
          setChartData(response.data.data as ProviderStatsResponse);
        }
      } catch (error) {
        console.error("Failed to load provider stats chart:", error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [provider, jawnClient]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await jawnClient.GET(
          "/v1/public/stats/providers/{provider}",
          {
            params: { path: { provider }, query: { timeframe: leaderboardTimeframe } },
          }
        );

        if (response.data?.data) {
          setLeaderboardData(response.data.data as ProviderStatsResponse);
        }
      } catch (error) {
        console.error("Failed to load provider stats leaderboard:", error);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [provider, leaderboardTimeframe, jawnClient]);

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

      {/* Uptime Status Bar */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uptime (Last Year)
          </h2>
          {overallUptime !== null && !uptimeLoading && (
            <span
              className={`text-sm font-medium ${
                overallUptime >= 99
                  ? "text-green-600 dark:text-green-400"
                  : overallUptime >= 95
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {overallUptime.toFixed(2)}%
            </span>
          )}
        </div>
        <UptimeStatusBar
          data={uptimeData}
          isLoading={uptimeLoading}
          variant="full"
        />
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
