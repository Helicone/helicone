"use client";

import { Leaderboard, LeaderboardItem } from "./components/Leaderboard";
import { formatTokens } from "@/utils/formatters";

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

export function ModelLeaderboard({ data, isLoading }: ModelLeaderboardProps) {
  const items: LeaderboardItem[] = data.map((entry) => {
    const isOther = entry.model.toLowerCase() === "other";
    return {
      rank: entry.rank,
      name: entry.model,
      href: isOther ? undefined : `/model/${encodeURIComponent(entry.model)}`,
      subtitle: entry.author,
      subtitleHref: isOther ? undefined : `/stats/authors/${entry.author}`,
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
