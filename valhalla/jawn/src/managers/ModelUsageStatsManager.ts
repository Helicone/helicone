import { Result, ok, err } from "../packages/common/result";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { StatsTimeFrame } from "../controllers/public/statsController";
import { registry } from "@helicone-package/cost/models/registry";

interface ModelTokens {
  model: string;
  totalTokens: number;
}

interface ModelUsageTimeSeriesDataPoint {
  time: string;
  models: ModelTokens[];
}

interface ModelUsageLeaderboardEntry {
  rank: number;
  model: string;
  provider: string;
  author: string;
  totalTokens: number;
  previousPeriodTokens: number | null;
  percentChange: number | null;
  rankChange: number | null;
}

export interface ModelUsageResponse {
  timeSeries: ModelUsageTimeSeriesDataPoint[];
  leaderboard: ModelUsageLeaderboardEntry[];
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

export interface MarketShareResponse {
  timeSeries: MarketShareTimeSeriesDataPoint[];
  leaderboard: MarketShareLeaderboardEntry[];
}

interface TimeSeriesQueryResult {
  time_bucket: string;
  model: string;
  total_tokens: number;
}

interface LeaderboardQueryResult {
  model: string;
  top_provider: string;
  total_tokens: number;
}

interface PreviousPeriodQueryResult {
  model: string;
  total_tokens: number;
  rank: number;
}

const TOTAL_TOKENS_EXPR = `total_prompt_tokens + total_completion_tokens + total_completion_audio_tokens + total_prompt_audio_tokens + total_prompt_cache_write_tokens + total_prompt_cache_read_tokens`;

const BASE_WHERE_CLAUSE = `model != '' AND provider != 'CUSTOM'`;

const TIME_CONFIG = {
  "24h": { interval: "INTERVAL 1 DAY", bucket: "INTERVAL 1 HOUR" },
  "7d": { interval: "INTERVAL 7 DAY", bucket: "INTERVAL 6 HOUR" },
  "30d": { interval: "INTERVAL 30 DAY", bucket: "INTERVAL 1 DAY" },
  "3m": { interval: "INTERVAL 3 MONTH", bucket: "INTERVAL 1 DAY" },
  "1y": { interval: "INTERVAL 1 YEAR", bucket: "INTERVAL 1 WEEK" },
} as const;

/**
 * Manager for querying model usage and market share statistics from ClickHouse.
 * Data comes from the request_stats materialized view which aggregates AI Gateway requests.
 */
export class ModelUsageStatsManager {
  /**
   * Get model usage statistics including time series data and leaderboard.
   * Returns top 10 models by token usage with comparison to previous period.
   */
  async getModelUsage(
    timeframe: StatsTimeFrame
  ): Promise<Result<ModelUsageResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];

    const timeSeriesQuery = `
      WITH top_models AS (
        SELECT model
        FROM request_stats
        WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        GROUP BY model
        ORDER BY sum(${TOTAL_TOKENS_EXPR}) DESC
        LIMIT 10
      )
      SELECT 
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        model,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND model IN (SELECT model FROM top_models) AND provider != 'CUSTOM'
      GROUP BY time_bucket, model
      ORDER BY time_bucket ASC, total_tokens DESC
    `;

    const leaderboardQuery = `
      SELECT 
        model,
        argMax(provider, ${TOTAL_TOKENS_EXPR}) as top_provider,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY model
      ORDER BY total_tokens DESC
      LIMIT 20
    `;

    const previousPeriodQuery = `
      SELECT model, total_tokens, row_number() OVER (ORDER BY total_tokens DESC) as rank
      FROM (
        SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
        FROM request_stats
        WHERE hour >= now() - ${interval} - ${interval} AND hour < now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        GROUP BY model
      )
    `;

    const [timeSeriesResult, leaderboardResult, previousPeriodResult] =
      await Promise.all([
        clickhouseDb.dbQuery<TimeSeriesQueryResult>(timeSeriesQuery, []),
        clickhouseDb.dbQuery<LeaderboardQueryResult>(leaderboardQuery, []),
        clickhouseDb.dbQuery<PreviousPeriodQueryResult>(previousPeriodQuery, []),
      ]);

    if (timeSeriesResult.error) return err(timeSeriesResult.error);
    if (leaderboardResult.error) return err(leaderboardResult.error);
    if (previousPeriodResult.error) return err(previousPeriodResult.error);

    const previousPeriodTokensMap = new Map<string, number>();
    const previousPeriodRankMap = new Map<string, number>();
    for (const row of previousPeriodResult.data ?? []) {
      previousPeriodTokensMap.set(row.model, Number(row.total_tokens));
      previousPeriodRankMap.set(row.model, Number(row.rank));
    }

    const timeSeriesMap = new Map<string, ModelTokens[]>();
    for (const row of timeSeriesResult.data ?? []) {
      const time = row.time_bucket;
      if (!timeSeriesMap.has(time)) {
        timeSeriesMap.set(time, []);
      }
      timeSeriesMap.get(time)!.push({
        model: row.model,
        totalTokens: Number(row.total_tokens),
      });
    }

    const timeSeries: ModelUsageTimeSeriesDataPoint[] = Array.from(
      timeSeriesMap.entries()
    ).map(([time, models]) => ({ time, models }));

    const knownModels = (leaderboardResult.data ?? []).filter(
      (row) => registry.getAuthorByModel(row.model) !== null
    );

    const leaderboard: ModelUsageLeaderboardEntry[] = knownModels.map(
      (row, index) => {
        const currentRank = index + 1;
        const currentTokens = Number(row.total_tokens);
        const previousTokens = previousPeriodTokensMap.get(row.model);
        const previousRank = previousPeriodRankMap.get(row.model);

        let percentChange: number | null = null;
        if (previousTokens !== undefined && previousTokens > 0) {
          percentChange =
            ((currentTokens - previousTokens) / previousTokens) * 100;
        }

        let rankChange: number | null = null;
        if (previousRank !== undefined) {
          rankChange = previousRank - currentRank;
        }

        return {
          rank: currentRank,
          model: row.model,
          provider: row.top_provider,
          author: registry.getAuthorByModel(row.model)!,
          totalTokens: currentTokens,
          previousPeriodTokens: previousTokens ?? null,
          percentChange,
          rankChange,
        };
      }
    );

    return ok({ timeSeries, leaderboard });
  }

  /**
   * Get market share statistics by author (model provider).
   * Returns time series data normalized to 100% and a leaderboard of top 9 authors + others.
   */
  async getMarketShare(
    timeframe: StatsTimeFrame
  ): Promise<Result<MarketShareResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];

    const timeSeriesQuery = `
      SELECT 
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        model,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY time_bucket, model
      ORDER BY time_bucket ASC
    `;

    const leaderboardQuery = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY model
      ORDER BY total_tokens DESC
    `;

    const previousPeriodQuery = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval} AND hour < now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY model
      ORDER BY total_tokens DESC
    `;

    const [timeSeriesResult, leaderboardResult, previousPeriodResult] =
      await Promise.all([
        clickhouseDb.dbQuery<{
          time_bucket: string;
          model: string;
          total_tokens: number;
        }>(timeSeriesQuery, []),
        clickhouseDb.dbQuery<{ model: string; total_tokens: number }>(
          leaderboardQuery,
          []
        ),
        clickhouseDb.dbQuery<{ model: string; total_tokens: number }>(
          previousPeriodQuery,
          []
        ),
      ]);

    if (timeSeriesResult.error) return err(timeSeriesResult.error);
    if (leaderboardResult.error) return err(leaderboardResult.error);
    if (previousPeriodResult.error) return err(previousPeriodResult.error);

    const authorTotals = this.aggregateByAuthor(leaderboardResult.data ?? []);
    const prevAuthorTotals = this.aggregateByAuthor(
      previousPeriodResult.data ?? []
    );

    const sortedAuthors = Array.from(authorTotals.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const top9Authors = new Set(
      sortedAuthors.slice(0, 9).map(([author]) => author)
    );
    const grandTotal = sortedAuthors.reduce((sum, [, tokens]) => sum + tokens, 0);

    const prevSortedAuthors = Array.from(prevAuthorTotals.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const prevGrandTotal = prevSortedAuthors.reduce(
      (sum, [, tokens]) => sum + tokens,
      0
    );

    const prevRankMap = new Map<string, number>();
    const prevMarketShareMap = new Map<string, number>();
    let prevOthersTokens = 0;

    for (let i = 0; i < prevSortedAuthors.length; i++) {
      const [author, tokens] = prevSortedAuthors[i];
      if (top9Authors.has(author)) {
        prevRankMap.set(author, i + 1);
        prevMarketShareMap.set(
          author,
          prevGrandTotal > 0 ? (tokens / prevGrandTotal) * 100 : 0
        );
      } else {
        prevOthersTokens += tokens;
      }
    }
    if (prevGrandTotal > 0) {
      prevMarketShareMap.set(
        "others",
        (prevOthersTokens / prevGrandTotal) * 100
      );
    }

    const leaderboard: MarketShareLeaderboardEntry[] = [];
    let othersTokens = 0;

    for (let i = 0; i < sortedAuthors.length; i++) {
      const [author, tokens] = sortedAuthors[i];
      if (i < 9) {
        const currentRank = i + 1;
        const currentMarketShare =
          grandTotal > 0 ? (tokens / grandTotal) * 100 : 0;
        const prevRank = prevRankMap.get(author);
        const prevMarketShare = prevMarketShareMap.get(author);

        leaderboard.push({
          rank: currentRank,
          author,
          totalTokens: tokens,
          marketShare: currentMarketShare,
          rankChange: prevRank !== undefined ? prevRank - currentRank : null,
          marketShareChange:
            prevMarketShare !== undefined
              ? currentMarketShare - prevMarketShare
              : null,
        });
      } else {
        othersTokens += tokens;
      }
    }

    if (sortedAuthors.length > 9) {
      const othersMarketShare =
        grandTotal > 0 ? (othersTokens / grandTotal) * 100 : 0;
      const prevOthersMarketShare = prevMarketShareMap.get("others");

      leaderboard.push({
        rank: 10,
        author: "others",
        totalTokens: othersTokens,
        marketShare: othersMarketShare,
        rankChange: null,
        marketShareChange:
          prevOthersMarketShare !== undefined
            ? othersMarketShare - prevOthersMarketShare
            : null,
      });
    }

    const timeSeriesMap = new Map<string, Map<string, number>>();

    for (const row of timeSeriesResult.data ?? []) {
      const time = row.time_bucket;
      const author = registry.getAuthorByModel(row.model);
      if (author === null) continue;
      const displayAuthor = top9Authors.has(author) ? author : "others";

      if (!timeSeriesMap.has(time)) {
        timeSeriesMap.set(time, new Map());
      }
      const authorMap = timeSeriesMap.get(time)!;
      const current = authorMap.get(displayAuthor) ?? 0;
      authorMap.set(displayAuthor, current + Number(row.total_tokens));
    }

    const timeSeries: MarketShareTimeSeriesDataPoint[] = Array.from(
      timeSeriesMap.entries()
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, authorMap]) => {
        const bucketTotal = Array.from(authorMap.values()).reduce(
          (sum, t) => sum + t,
          0
        );
        const authors: AuthorTokens[] = Array.from(authorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([author, tokens]) => ({
            author,
            totalTokens: tokens,
            percentage: bucketTotal > 0 ? (tokens / bucketTotal) * 100 : 0,
          }));
        return { time, authors };
      });

    return ok({ timeSeries, leaderboard });
  }

  /**
   * Aggregate token counts by author from model-level data.
   * Skips models not found in the registry.
   */
  private aggregateByAuthor(
    data: { model: string; total_tokens: number }[]
  ): Map<string, number> {
    const authorTotals = new Map<string, number>();
    for (const row of data) {
      const author = registry.getAuthorByModel(row.model);
      if (author === null) continue;
      const current = authorTotals.get(author) ?? 0;
      authorTotals.set(author, current + Number(row.total_tokens));
    }
    return authorTotals;
  }
}
