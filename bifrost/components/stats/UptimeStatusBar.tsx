"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export interface UptimeDataPoint {
  time: string;
  totalRequests: number;
  successfulRequests: number;
  successRate: number;
}

interface UptimeStatusBarProps {
  data: UptimeDataPoint[];
  isLoading?: boolean;
  variant?: "full" | "compact";
  expectedBars?: number; // Number of bars to show (fills with gray if less data)
}

function getBarColor(successRate: number, hasData: boolean): string {
  if (!hasData) {
    return "bg-gray-300 dark:bg-gray-700";
  }
  if (successRate >= 99) {
    return "bg-green-500 dark:bg-green-600";
  }
  if (successRate >= 95) {
    return "bg-amber-500 dark:bg-amber-600";
  }
  return "bg-red-500 dark:bg-red-600";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UptimeStatusBar({
  data,
  isLoading = false,
  variant = "full",
  expectedBars,
}: UptimeStatusBarProps) {
  // Determine number of bars to display
  // Full variant shows ~122 bars (every 3 days for 1 year), compact shows 30 bars
  const numBars = expectedBars ?? (variant === "full" ? 122 : 30);

  if (isLoading) {
    return (
      <div className="flex items-center gap-px w-full">
        {Array.from({ length: numBars }).map((_, i) => (
          <Skeleton
            key={i}
            className={`flex-1 ${variant === "full" ? "h-6" : "h-4"} rounded-[1px]`}
          />
        ))}
      </div>
    );
  }

  // If we have fewer data points than expected, pad with empty entries at the start
  const paddedData: (UptimeDataPoint | null)[] = [];
  const dataStartIndex = Math.max(0, numBars - data.length);
  
  for (let i = 0; i < numBars; i++) {
    if (i < dataStartIndex) {
      paddedData.push(null);
    } else {
      paddedData.push(data[i - dataStartIndex] ?? null);
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-px w-full">
        {paddedData.map((point, index) => {
          const hasData = point !== null && point.totalRequests > 0;
          const successRate = point?.successRate ?? 0;
          const barColor = getBarColor(successRate, hasData);

          const barClasses = variant === "full"
            ? "flex-1 h-6 rounded-[1px]"
            : "flex-1 h-4 rounded-[1px]";

          if (!hasData) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className={`${barClasses} ${barColor} cursor-default`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs text-gray-500">No data</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className={`${barClasses} ${barColor} cursor-default`} />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-medium">{formatDate(point.time)}</p>
                  <p>
                    <span
                      className={
                        successRate >= 99
                          ? "text-green-600 dark:text-green-400"
                          : successRate >= 95
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {successRate.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Simple inline version for tables (no tooltip, just visual)
export function UptimeStatusBarInline({
  data,
  isLoading = false,
}: {
  data: UptimeDataPoint[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-px">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-1.5 h-4 rounded-sm" />
        ))}
      </div>
    );
  }

  // Show last 4 data points for compact inline display
  const recentData = data.slice(-4);
  
  // Pad with empty if less than 4
  const paddedData: (UptimeDataPoint | null)[] = [];
  for (let i = 0; i < 4; i++) {
    const dataIndex = i - (4 - recentData.length);
    paddedData.push(dataIndex >= 0 ? recentData[dataIndex] : null);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-px cursor-default">
            {paddedData.map((point, index) => {
              const hasData = point !== null && point.totalRequests > 0;
              const successRate = point?.successRate ?? 0;
              const barColor = getBarColor(successRate, hasData);

              return (
                <div
                  key={index}
                  className={`w-1.5 h-4 rounded-sm ${barColor}`}
                />
              );
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {data.length > 0 ? (
            <div className="text-xs">
              <p>
                Last 30 days:{" "}
                <span
                  className={
                    const totalReqs = data.reduce((sum, d) => sum + d.totalRequests, 0);
                    const successReqs = data.reduce((sum, d) => sum + d.successfulRequests, 0);
                    const overallSuccessRate = totalReqs > 0 ? ((successReqs / totalReqs) * 100) : 0;
                    return overallSuccessRate >= 99
                      ? "text-green-600 dark:text-green-400"
                      : data[data.length - 1]?.successRate >= 95
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {(() => {
                    const totalReqs = data.reduce((sum, d) => sum + d.totalRequests, 0);
                    const successReqs = data.reduce((sum, d) => sum + d.successfulRequests, 0);
                    return totalReqs > 0 ? ((successReqs / totalReqs) * 100).toFixed(1) : "0";
                  })()}
                  %
                </span>{" "}
                uptime
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No data</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
