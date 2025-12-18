"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLOR_PALETTE } from "@/lib/chartColors";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatTokens } from "@/utils/formatters";

interface LeaderboardEntry {
  rank: number;
  author: string;
  totalTokens: number;
  marketShare: number;
  rankChange: number | null;
  marketShareChange: number | null;
}

interface MarketShareLeaderboardProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
}

function RankChangeIndicator({ rankChange }: { rankChange: number | null }) {
  if (rankChange === null || rankChange === 0 || !isFinite(rankChange)) {
    return null;
  }

  if (rankChange > 0) {
    return (
      <span className="flex items-center text-green-600 dark:text-green-400">
        <ChevronUp className="h-4 w-4" />
        <span className="text-xs tabular-nums">{rankChange}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center text-red-600 dark:text-red-400">
      <ChevronDown className="h-4 w-4" />
      <span className="text-xs tabular-nums">{Math.abs(rankChange)}</span>
    </span>
  );
}

function MarketShareChangeIndicator({ change }: { change: number | null }) {
  if (change === null || !isFinite(change) || isNaN(change)) {
    return null;
  }

  if (Math.abs(change) < 0.05) {
    return <span className="text-xs text-gray-400 tabular-nums">0.0%</span>;
  }

  const isPositive = change > 0;
  const displayValue = Math.abs(change).toFixed(1);

  return (
    <span
      className={`text-xs tabular-nums ${
        isPositive
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {isPositive ? "+" : "-"}
      {displayValue}%
    </span>
  );
}

function LeaderboardItem({
  entry,
  colorIndex,
}: {
  entry: LeaderboardEntry;
  colorIndex: number;
}) {
  const isOther = entry.author.toLowerCase() === "others";
  const color = CHART_COLOR_PALETTE[colorIndex % CHART_COLOR_PALETTE.length];
  const marketShare = isFinite(entry.marketShare) ? entry.marketShare : 0;
  const totalTokens = isFinite(entry.totalTokens) ? entry.totalTokens : 0;

  return (
    <div className="flex items-start gap-3 py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-6 text-right tabular-nums">
        {entry.rank}.
      </span>
      <div
        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {entry.author}
        </span>
      </div>
      <div className="w-10 flex justify-end">
        {!isOther && <RankChangeIndicator rankChange={entry.rankChange} />}
      </div>
      <div className="text-right min-w-[70px]">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
          {marketShare.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {formatTokens(totalTokens)}
        </div>
        <MarketShareChangeIndicator change={entry.marketShareChange} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-8">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="w-6 h-4" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-10 h-4" />
          <div className="text-right">
            <Skeleton className="w-12 h-4 mb-1" />
            <Skeleton className="w-10 h-3 mb-1" />
            <Skeleton className="w-8 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketShareLeaderboard({
  data,
  isLoading,
}: MarketShareLeaderboardProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const leftColumn = data.slice(0, 5);
  const rightColumn = data.slice(5, 10);

  return (
    <div className="grid grid-cols-2 gap-x-8">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {leftColumn.map((entry, index) => (
          <LeaderboardItem key={entry.author} entry={entry} colorIndex={index} />
        ))}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {rightColumn.map((entry, index) => (
          <LeaderboardItem
            key={entry.author}
            entry={entry}
            colorIndex={index + 5}
          />
        ))}
      </div>
    </div>
  );
}
