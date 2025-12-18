"use client";

import { Leaderboard, LeaderboardItem } from "./components/Leaderboard";
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

export function MarketShareLeaderboard({
  data,
  isLoading,
}: MarketShareLeaderboardProps) {
  const items: LeaderboardItem[] = data.map((entry) => {
    const isOther = entry.author.toLowerCase() === "others";
    const marketShare = isFinite(entry.marketShare) ? entry.marketShare : 0;
    const totalTokens = isFinite(entry.totalTokens) ? entry.totalTokens : 0;

    return {
      rank: entry.rank,
      name: entry.author,
      href: isOther ? undefined : `/stats/authors/${entry.author}`,
      primaryValue: `${marketShare.toFixed(1)}%`,
      secondaryValue: formatTokens(totalTokens),
      change: isOther ? undefined : { type: "rank", value: entry.rankChange },
      secondaryChange: { type: "share", value: entry.marketShareChange },
      isOther,
    };
  });

  return (
    <Leaderboard
      data={items}
      isLoading={isLoading}
      showColorDots={true}
      showAllToggle={false}
      layout="split"
    />
  );
}
