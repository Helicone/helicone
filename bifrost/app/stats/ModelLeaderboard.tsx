"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokens, formatPercentChange } from "@/utils/formatters";

interface LeaderboardEntry {
  rank: number;
  model: string;
  author: string;
  totalTokens: number;
  percentChange: number | null;
}

interface ModelLeaderboardProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
}

function LeaderboardRow({ item }: { item: LeaderboardEntry }) {
  const isNew = item.percentChange === null;
  const isPositive = item.percentChange !== null && item.percentChange >= 0;

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800/50 last:border-b-0">
      <div className="flex items-start gap-4">
        <span className="text-sm text-gray-400 dark:text-gray-500 w-6 tabular-nums">
          {item.rank}.
        </span>
        <div>
          <span className="text-sm font-normal text-gray-900 dark:text-gray-100">
            {item.model}
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            by {item.author}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-normal tabular-nums text-gray-900 dark:text-gray-100">
          {formatTokens(item.totalTokens)} tokens
        </span>
        {isNew ? (
          <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mt-0.5">
            NEW
          </span>
        ) : (
          <span
            className={`text-xs font-medium mt-0.5 ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatPercentChange(item.percentChange!)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ModelLeaderboard({ data, isLoading }: ModelLeaderboardProps) {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="py-4 border-b border-gray-100 dark:border-gray-800/50"
            >
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-0 hidden lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="py-4 border-b border-gray-100 dark:border-gray-800/50"
            >
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const displayData = showAll ? data : data.slice(0, 10);
  const leftColumn = displayData.filter((_, i) => i % 2 === 0);
  const rightColumn = displayData.filter((_, i) => i % 2 === 1);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
        <div>
          {leftColumn.map((item) => (
            <LeaderboardRow key={item.model} item={item} />
          ))}
        </div>
        <div>
          {rightColumn.map((item) => (
            <LeaderboardRow key={item.model} item={item} />
          ))}
        </div>
      </div>
      {data.length > 10 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {showAll ? "Show less" : "Show more"}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
