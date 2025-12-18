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
  author: string;
  totalTokens: number;
  percentChange: number | null;
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

interface ProviderTokens {
  provider: string;
  totalTokens: number;
}

interface ProviderUsageTimeSeriesDataPoint {
  time: string;
  providers: ProviderTokens[];
}

interface ProviderUsageLeaderboardEntry {
  rank: number;
  provider: string;
  totalTokens: number;
  percentChange: number | null;
}

export interface ProviderUsageResponse {
  timeSeries: ProviderUsageTimeSeriesDataPoint[];
  leaderboard: ProviderUsageLeaderboardEntry[];
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

export class ModelUsageStatsManager {
  /**
   * Get model usage: top 9 models + "other" with time series and leaderboard.
   */
  async getModelUsage(
    timeframe: StatsTimeFrame
  ): Promise<Result<ModelUsageResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];

    // Step 1: Get top 9 models with token counts
    const top9Query = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY model
      ORDER BY total_tokens DESC
      LIMIT 9
    `;

    const top9Result = await clickhouseDb.dbQuery<{
      model: string;
      total_tokens: number;
    }>(top9Query, []);
    if (top9Result.error) return err(top9Result.error);

    const top9Data = top9Result.data ?? [];
    const top9Set = new Set(top9Data.map((r) => r.model));
    const inClause = top9Data.length > 0 
    ? top9Data.map((r) => `'${r.provider}'`).join(",")
      : "''";

    // Step 2: Get "other" total + previous period data + time series (parallel)
    const otherQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND model NOT IN (${inClause})
    `;

    const prevTop9Query = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval} 
        AND hour < now() - ${interval} 
        AND ${BASE_WHERE_CLAUSE}
        AND model IN (${inClause})
      GROUP BY model
    `;

    const prevOtherQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval} 
        AND hour < now() - ${interval} 
        AND ${BASE_WHERE_CLAUSE}
        AND model NOT IN (${inClause})
    `;

    const timeSeriesQuery = `
      SELECT 
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        model,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY time_bucket, model
    `;

    const [otherResult, prevTop9Result, prevOtherResult, timeSeriesResult] =
      await Promise.all([
        clickhouseDb.dbQuery<{ total_tokens: number }>(otherQuery, []),
        clickhouseDb.dbQuery<{ model: string; total_tokens: number }>(prevTop9Query, []),
        clickhouseDb.dbQuery<{ total_tokens: number }>(prevOtherQuery, []),
        clickhouseDb.dbQuery<{ time_bucket: string; model: string; total_tokens: number }>(timeSeriesQuery, []),
      ]);

    if (otherResult.error) return err(otherResult.error);
    if (prevTop9Result.error) return err(prevTop9Result.error);
    if (prevOtherResult.error) return err(prevOtherResult.error);
    if (timeSeriesResult.error) return err(timeSeriesResult.error);

    // Build previous period map
    const prevTokensMap = new Map<string, number>();
    for (const row of prevTop9Result.data ?? []) {
      prevTokensMap.set(row.model, Number(row.total_tokens));
    }
    const prevOtherTokens = Number(prevOtherResult.data?.[0]?.total_tokens ?? 0);

    // Build leaderboard
    const otherTokens = Number(otherResult.data?.[0]?.total_tokens ?? 0);
    const leaderboard: ModelUsageLeaderboardEntry[] = [];

    for (let i = 0; i < top9Data.length; i++) {
      const { model, total_tokens } = top9Data[i];
      const currentTokens = Number(total_tokens);
      const prevTokens = prevTokensMap.get(model);

      leaderboard.push({
        rank: i + 1,
        model,
        author: registry.getAuthorByModel(model) ?? "unknown",
        totalTokens: currentTokens,
        percentChange:
          prevTokens && prevTokens > 0
            ? ((currentTokens - prevTokens) / prevTokens) * 100
            : null,
      });
    }

    leaderboard.push({
      rank: 10,
      model: "other",
      author: "various",
      totalTokens: otherTokens,
      percentChange:
        prevOtherTokens > 0
          ? ((otherTokens - prevOtherTokens) / prevOtherTokens) * 100
          : null,
    });

    // Build time series
    const timeSeriesMap = new Map<string, Map<string, number>>();
    for (const row of timeSeriesResult.data ?? []) {
      const displayModel = top9Set.has(row.model) ? row.model : "other";
      if (!timeSeriesMap.has(row.time_bucket)) {
        timeSeriesMap.set(row.time_bucket, new Map());
      }
      const modelMap = timeSeriesMap.get(row.time_bucket)!;
      modelMap.set(displayModel, (modelMap.get(displayModel) ?? 0) + Number(row.total_tokens));
    }

    const timeSeries: ModelUsageTimeSeriesDataPoint[] = Array.from(timeSeriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, modelMap]) => ({
        time,
        models: Array.from(modelMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([model, tokens]) => ({ model, totalTokens: tokens })),
      }));

    return ok({ timeSeries, leaderboard });
  }

  /**
   * Get market share by author: top 9 authors + "others" with time series.
   */
  async getMarketShare(
    timeframe: StatsTimeFrame
  ): Promise<Result<MarketShareResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];

    const modelsQuery = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY model
    `;

    const modelsResult = await clickhouseDb.dbQuery<{
      model: string;
      total_tokens: number;
    }>(modelsQuery, []);
    if (modelsResult.error) return err(modelsResult.error);

    const authorTotals = this.aggregateByAuthor(modelsResult.data ?? []);
    const sortedAuthors = Array.from(authorTotals.entries()).sort((a, b) => b[1] - a[1]);
    const top9Authors = new Set(sortedAuthors.slice(0, 9).map(([a]) => a));
    const grandTotal = sortedAuthors.reduce((sum, [, t]) => sum + t, 0);

    // Previous period + time series (parallel)
    const prevModelsQuery = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval} 
        AND hour < now() - ${interval} 
        AND ${BASE_WHERE_CLAUSE}
      GROUP BY model
    `;

    const timeSeriesQuery = `
      SELECT 
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        model,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY time_bucket, model
    `;

    const [prevModelsResult, timeSeriesResult] = await Promise.all([
      clickhouseDb.dbQuery<{ model: string; total_tokens: number }>(prevModelsQuery, []),
      clickhouseDb.dbQuery<{ time_bucket: string; model: string; total_tokens: number }>(timeSeriesQuery, []),
    ]);

    if (prevModelsResult.error) return err(prevModelsResult.error);
    if (timeSeriesResult.error) return err(timeSeriesResult.error);

    // Previous period stats
    const prevAuthorTotals = this.aggregateByAuthor(prevModelsResult.data ?? []);
    const prevSorted = Array.from(prevAuthorTotals.entries()).sort((a, b) => b[1] - a[1]);
    const prevGrandTotal = prevSorted.reduce((sum, [, t]) => sum + t, 0);

    const prevRankMap = new Map<string, number>();
    const prevShareMap = new Map<string, number>();
    let prevOthersTokens = 0;

    for (let i = 0; i < prevSorted.length; i++) {
      const [author, tokens] = prevSorted[i];
      if (top9Authors.has(author)) {
        prevRankMap.set(author, i + 1);
        prevShareMap.set(author, prevGrandTotal > 0 ? (tokens / prevGrandTotal) * 100 : 0);
      } else {
        prevOthersTokens += tokens;
      }
    }
    if (prevGrandTotal > 0) {
      prevShareMap.set("others", (prevOthersTokens / prevGrandTotal) * 100);
    }

    // Build leaderboard
    const leaderboard: MarketShareLeaderboardEntry[] = [];
    let othersTokens = 0;

    for (let i = 0; i < sortedAuthors.length; i++) {
      const [author, tokens] = sortedAuthors[i];
      if (i < 9) {
        const share = grandTotal > 0 ? (tokens / grandTotal) * 100 : 0;
        const prevRank = prevRankMap.get(author);
        const prevShare = prevShareMap.get(author);

        leaderboard.push({
          rank: i + 1,
          author,
          totalTokens: tokens,
          marketShare: share,
          rankChange: prevRank !== undefined ? prevRank - (i + 1) : null,
          marketShareChange: prevShare !== undefined ? share - prevShare : null,
        });
      } else {
        othersTokens += tokens;
      }
    }

    if (sortedAuthors.length > 9) {
      const othersShare = grandTotal > 0 ? (othersTokens / grandTotal) * 100 : 0;
      const prevOthersShare = prevShareMap.get("others");

      leaderboard.push({
        rank: 10,
        author: "others",
        totalTokens: othersTokens,
        marketShare: othersShare,
        rankChange: null,
        marketShareChange: prevOthersShare !== undefined ? othersShare - prevOthersShare : null,
      });
    }

    // Build time series
    const timeSeriesMap = new Map<string, Map<string, number>>();
    for (const row of timeSeriesResult.data ?? []) {
      const author = registry.getAuthorByModel(row.model);
      if (!author) continue;
      const displayAuthor = top9Authors.has(author) ? author : "others";

      if (!timeSeriesMap.has(row.time_bucket)) {
        timeSeriesMap.set(row.time_bucket, new Map());
      }
      const authorMap = timeSeriesMap.get(row.time_bucket)!;
      authorMap.set(displayAuthor, (authorMap.get(displayAuthor) ?? 0) + Number(row.total_tokens));
    }

    const timeSeries: MarketShareTimeSeriesDataPoint[] = Array.from(timeSeriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, authorMap]) => {
        const total = Array.from(authorMap.values()).reduce((s, t) => s + t, 0);
        return {
          time,
          authors: Array.from(authorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([author, tokens]) => ({
              author,
              totalTokens: tokens,
              percentage: total > 0 ? (tokens / total) * 100 : 0,
            })),
        };
      });

    return ok({ timeSeries, leaderboard });
  }

  /**
   * Get provider usage: top 9 providers + "other" with time series and leaderboard.
   */
  async getProviderUsage(
    timeframe: StatsTimeFrame
  ): Promise<Result<ProviderUsageResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];

    const top9Query = `
      SELECT provider, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY provider
      ORDER BY total_tokens DESC
      LIMIT 9
    `;

    const top9Result = await clickhouseDb.dbQuery<{
      provider: string;
      total_tokens: number;
    }>(top9Query, []);
    if (top9Result.error) return err(top9Result.error);

    const top9Data = top9Result.data ?? [];
    const top9Set = new Set(top9Data.map((r) => r.provider));
    const inClause = top9Data.length > 0
      ? top9Data.map((r) => `'${r.provider}'`).join(",")
      : "''";

    const otherQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND provider NOT IN (${inClause})
    `;

    const prevTop9Query = `
      SELECT provider, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval}
        AND hour < now() - ${interval}
        AND ${BASE_WHERE_CLAUSE}
        AND provider IN (${inClause})
      GROUP BY provider
    `;

    const prevOtherQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval}
        AND hour < now() - ${interval}
        AND ${BASE_WHERE_CLAUSE}
        AND provider NOT IN (${inClause})
    `;

    const timeSeriesQuery = `
      SELECT
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        provider,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY time_bucket, provider
    `;

    const [otherResult, prevTop9Result, prevOtherResult, timeSeriesResult] =
      await Promise.all([
        clickhouseDb.dbQuery<{ total_tokens: number }>(otherQuery, []),
        clickhouseDb.dbQuery<{ provider: string; total_tokens: number }>(prevTop9Query, []),
        clickhouseDb.dbQuery<{ total_tokens: number }>(prevOtherQuery, []),
        clickhouseDb.dbQuery<{ time_bucket: string; provider: string; total_tokens: number }>(timeSeriesQuery, []),
      ]);

    if (otherResult.error) return err(otherResult.error);
    if (prevTop9Result.error) return err(prevTop9Result.error);
    if (prevOtherResult.error) return err(prevOtherResult.error);
    if (timeSeriesResult.error) return err(timeSeriesResult.error);

    const prevTokensMap = new Map<string, number>();
    for (const row of prevTop9Result.data ?? []) {
      prevTokensMap.set(row.provider, Number(row.total_tokens));
    }
    const prevOtherTokens = Number(prevOtherResult.data?.[0]?.total_tokens ?? 0);

    const otherTokens = Number(otherResult.data?.[0]?.total_tokens ?? 0);
    const leaderboard: ProviderUsageLeaderboardEntry[] = [];

    for (let i = 0; i < top9Data.length; i++) {
      const { provider, total_tokens } = top9Data[i];
      const currentTokens = Number(total_tokens);
      const prevTokens = prevTokensMap.get(provider);

      leaderboard.push({
        rank: i + 1,
        provider,
        totalTokens: currentTokens,
        percentChange:
          prevTokens && prevTokens > 0
            ? ((currentTokens - prevTokens) / prevTokens) * 100
            : null,
      });
    }

    leaderboard.push({
      rank: 10,
      provider: "other",
      totalTokens: otherTokens,
      percentChange:
        prevOtherTokens > 0
          ? ((otherTokens - prevOtherTokens) / prevOtherTokens) * 100
          : null,
    });

    const timeSeriesMap = new Map<string, Map<string, number>>();
    for (const row of timeSeriesResult.data ?? []) {
      const displayProvider = top9Set.has(row.provider) ? row.provider : "other";
      if (!timeSeriesMap.has(row.time_bucket)) {
        timeSeriesMap.set(row.time_bucket, new Map());
      }
      const providerMap = timeSeriesMap.get(row.time_bucket)!;
      providerMap.set(displayProvider, (providerMap.get(displayProvider) ?? 0) + Number(row.total_tokens));
    }

    const timeSeries: ProviderUsageTimeSeriesDataPoint[] = Array.from(timeSeriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, providerMap]) => ({
        time,
        providers: Array.from(providerMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([provider, tokens]) => ({ provider, totalTokens: tokens })),
      }));

    return ok({ timeSeries, leaderboard });
  }

  private aggregateByAuthor(data: { model: string; total_tokens: number }[]): Map<string, number> {
    const totals = new Map<string, number>();
    for (const { model, total_tokens } of data) {
      const author = registry.getAuthorByModel(model);
      if (!author) continue;
      totals.set(author, (totals.get(author) ?? 0) + Number(total_tokens));
    }
    return totals;
  }
}
