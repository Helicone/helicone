"use client";

import { Leaderboard, LeaderboardItem } from "./components/Leaderboard";
import { formatTokens } from "@/utils/formatters";

interface LeaderboardEntry {
  rank: number;
  provider: string;
  totalTokens: number;
  percentChange: number | null;
}

interface ProviderLeaderboardProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
}

export function ProviderLeaderboard({
  data,
  isLoading,
}: ProviderLeaderboardProps) {
  const items: LeaderboardItem[] = data.map((entry) => {
    const isOther = entry.provider.toLowerCase() === "other";
    return {
      rank: entry.rank,
      name: entry.provider,
      href: isOther ? undefined : `/stats/providers/${entry.provider}`,
      primaryValue: `${formatTokens(entry.totalTokens)} tokens`,
      change: isOther ? undefined : { type: "percent", value: entry.percentChange },
      isOther,
    };
  });

  return (
    <Leaderboard
      data={items}
      isLoading={isLoading}
      showColorDots={false}
      showAllToggle={true}
      layout="alternating"
    />
  );
}
