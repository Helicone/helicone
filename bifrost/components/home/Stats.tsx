"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

// Baseline date: January 6, 2025 (UTC)
const BASELINE_DATE = new Date("2025-01-06T00:00:00Z");

// Baseline values (update these periodically with real numbers)
const BASELINE_REQUESTS = 3_000_000_000; // 3 billion
const BASELINE_TOKENS_TRILLION = 31.5; // 31.5 trillion
const BASELINE_USERS = 20_600_000; // 20.6 million

// Growth rates
const REQUESTS_PER_DAY = 50_000_000; // 50 million per day
const TOKENS_TRILLION_PER_MONTH = 1; // 1 trillion per month
const USERS_PER_MONTH = 1_000_000; // 1 million per month

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30.44; // Average days per month

function getGrowthMetrics() {
  const now = new Date();
  const daysSinceBaseline = Math.floor(
    (now.getTime() - BASELINE_DATE.getTime()) / MS_PER_DAY
  );
  const monthsSinceBaseline = daysSinceBaseline / DAYS_PER_MONTH;

  return {
    requests: BASELINE_REQUESTS + daysSinceBaseline * REQUESTS_PER_DAY,
    tokensTrillion:
      BASELINE_TOKENS_TRILLION + monthsSinceBaseline * TOKENS_TRILLION_PER_MONTH,
    users: BASELINE_USERS + monthsSinceBaseline * USERS_PER_MONTH,
  };
}

function formatRequests(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)} billion`;
  }
  return num.toLocaleString();
}

function formatTokens(trillions: number): string {
  return `${trillions.toFixed(1)} Trillion`;
}

function formatUsers(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} million`;
  }
  return num.toLocaleString();
}

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<ReturnType<typeof getGrowthMetrics> | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only compute metrics on client to avoid SSR hydration mismatch
    setMetrics(getGrowthMetrics());
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#f2f9fc]">
      <div
        className={cn(
          ISLAND_WIDTH,
          "flex justify-between items-start pt-8 md:pt-12 pb-12 md:pb-16"
        )}
      >
        <h1 className="gap-y-4 text-2xl md:text-6xl font-semibold !leading-[150%] text-black max-w-[1100px] text-wrap">
          Today,{" "}
          <span
            ref={elementRef}
            className={cn(
              "inline-block bg-[#E7F6FD] border-[3px] border-brand rounded-xl py-1 px-5 text-brand translate-y-[-10px] transition-transform duration-500 text-nowrap",
              isVisible ? "rotate-[-3deg]" : "rotate-[0  deg]"
            )}
          >
            {formatRequests(metrics?.requests ?? BASELINE_REQUESTS)}
          </span>{" "}
          requests processed,{" "}
          <span className="text-brand">{formatTokens(metrics?.tokensTrillion ?? BASELINE_TOKENS_TRILLION)}</span> tokens a month,{" "}
          <span className="text-brand">{formatUsers(metrics?.users ?? BASELINE_USERS)}</span> users tracked
        </h1>
      </div>
    </div>
  );
};

export default Stats;
