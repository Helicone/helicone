"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLOR_PALETTE } from "@/lib/chartColors";
import { formatPercentChange } from "@/utils/formatters";

export interface LeaderboardChange {
  type: "percent" | "rank" | "share";
  value: number | null;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  href?: string;
  subtitle?: string;
  subtitleHref?: string;
  primaryValue: string;
  secondaryValue?: string;
  change?: LeaderboardChange;
  secondaryChange?: LeaderboardChange;
  isOther?: boolean;
}

interface LeaderboardProps {
  data: LeaderboardItem[];
  isLoading: boolean;
  showColorDots?: boolean;
  showAllToggle?: boolean;
  layout?: "split" | "alternating";
}

function RankChangeIndicator({ value }: { value: number | null }) {
  if (value === null || value === 0 || !isFinite(value)) {
    return null;
  }

  if (value > 0) {
    return (
      <span className="flex items-center text-green-600 dark:text-green-400">
        <ChevronUp className="h-4 w-4" />
        <span className="text-xs tabular-nums">{value}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center text-red-600 dark:text-red-400">
      <ChevronDown className="h-4 w-4" />
      <span className="text-xs tabular-nums">{Math.abs(value)}</span>
    </span>
  );
}

function PercentChangeIndicator({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mt-0.5">
        NEW
      </span>
    );
  }

  const isPositive = value >= 0;
  return (
    <span
      className={`text-xs font-medium mt-0.5 ${
        isPositive
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {formatPercentChange(value)}
    </span>
  );
}

function ShareChangeIndicator({ value }: { value: number | null }) {
  if (value === null || !isFinite(value) || isNaN(value)) {
    return null;
  }

  if (Math.abs(value) < 0.05) {
    return <span className="text-xs text-gray-400 tabular-nums">0.0%</span>;
  }

  const isPositive = value > 0;
  const displayValue = Math.abs(value).toFixed(1);

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

function ChangeIndicator({ change, isOther }: { change?: LeaderboardChange; isOther?: boolean }) {
  if (!change || isOther) return null;

  switch (change.type) {
    case "rank":
      return <RankChangeIndicator value={change.value} />;
    case "percent":
      return <PercentChangeIndicator value={change.value} />;
    case "share":
      return <ShareChangeIndicator value={change.value} />;
    default:
      return null;
  }
}

function LeaderboardRowStandard({ item }: { item: LeaderboardItem }) {
  const nameElement = item.href ? (
    <Link
      href={item.href}
      className="text-sm font-normal text-gray-900 dark:text-gray-100 hover:text-brand hover:underline"
    >
      {item.name}
    </Link>
  ) : (
    <span className="text-sm font-normal text-gray-900 dark:text-gray-100">
      {item.name}
    </span>
  );

  const subtitleElement = item.subtitle && (
    <div className="text-xs text-gray-500 dark:text-gray-400">
      by{" "}
      {item.subtitleHref ? (
        <Link href={item.subtitleHref} className="hover:text-brand hover:underline">
          {item.subtitle}
        </Link>
      ) : (
        item.subtitle
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800/50 last:border-b-0">
      <div className="flex items-start gap-4">
        <span className="text-sm text-gray-400 dark:text-gray-500 w-6 tabular-nums">
          {item.rank}.
        </span>
        <div>
          {nameElement}
          {subtitleElement}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-normal tabular-nums text-gray-900 dark:text-gray-100">
          {item.primaryValue}
        </span>
        {!item.isOther && item.change && (
          <ChangeIndicator change={item.change} isOther={item.isOther} />
        )}
      </div>
    </div>
  );
}

function LeaderboardRowWithDot({
  item,
  colorIndex,
}: {
  item: LeaderboardItem;
  colorIndex: number;
}) {
  const color = CHART_COLOR_PALETTE[colorIndex % CHART_COLOR_PALETTE.length];

  const nameElement = item.href ? (
    <Link
      href={item.href}
      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-brand hover:underline"
    >
      {item.name}
    </Link>
  ) : (
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
      {item.name}
    </span>
  );

  return (
    <div className="flex items-start gap-3 py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-6 text-right tabular-nums">
        {item.rank}.
      </span>
      <div
        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        {nameElement}
      </div>
      <div className="w-10 flex justify-end">
        {!item.isOther && item.change?.type === "rank" && (
          <RankChangeIndicator value={item.change.value} />
        )}
      </div>
      <div className="text-right min-w-[70px]">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
          {item.primaryValue}
        </div>
        {item.secondaryValue && (
          <div className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {item.secondaryValue}
          </div>
        )}
        {item.secondaryChange?.type === "share" && (
          <ShareChangeIndicator value={item.secondaryChange.value} />
        )}
      </div>
    </div>
  );
}

function LoadingSkeletonStandard() {
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

function LoadingSkeletonWithDots() {
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

export function Leaderboard({
  data,
  isLoading,
  showColorDots = false,
  showAllToggle = true,
  layout = "alternating",
}: LeaderboardProps) {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return showColorDots ? <LoadingSkeletonWithDots /> : <LoadingSkeletonStandard />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const displayData = showAllToggle && !showAll ? data.slice(0, 10) : data;

  let leftColumn: LeaderboardItem[];
  let rightColumn: LeaderboardItem[];

  if (layout === "split") {
    leftColumn = displayData.slice(0, Math.ceil(displayData.length / 2));
    rightColumn = displayData.slice(Math.ceil(displayData.length / 2));
  } else {
    leftColumn = displayData.filter((_, i) => i % 2 === 0);
    rightColumn = displayData.filter((_, i) => i % 2 === 1);
  }

  const RowComponent = showColorDots ? LeaderboardRowWithDot : LeaderboardRowStandard;

  return (
    <div>
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${showColorDots ? "gap-x-8" : "gap-x-16"}`}>
        <div className={showColorDots ? "divide-y divide-gray-100 dark:divide-gray-800" : ""}>
          {leftColumn.map((item, index) => (
            <RowComponent
              key={item.name}
              item={item}
              colorIndex={layout === "split" ? index : index * 2}
            />
          ))}
        </div>
        <div className={showColorDots ? "divide-y divide-gray-100 dark:divide-gray-800" : ""}>
          {rightColumn.map((item, index) => (
            <RowComponent
              key={item.name}
              item={item}
              colorIndex={layout === "split" ? index + leftColumn.length : index * 2 + 1}
            />
          ))}
        </div>
      </div>
      {showAllToggle && data.length > 10 && (
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
