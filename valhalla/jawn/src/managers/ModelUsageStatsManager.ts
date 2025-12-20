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

export interface AuthorStatsResponse {
  author: string;
  totalTokens: number;
  timeSeries: ModelUsageTimeSeriesDataPoint[];
  leaderboard: ModelUsageLeaderboardEntry[];
}

export interface ProviderStatsResponse {
  provider: string;
  totalTokens: number;
  timeSeries: ModelUsageTimeSeriesDataPoint[];
  leaderboard: ModelUsageLeaderboardEntry[];
}

interface ModelStatsTimeSeriesDataPoint {
  time: string;
  totalTokens: number;
}

export interface ModelStatsResponse {
  model: string;
  totalTokens: number;
  timeSeries: ModelStatsTimeSeriesDataPoint[];
}

interface UptimeDataPoint {
  time: string;
  totalRequests: number;
  successfulRequests: number;
  successRate: number;
}

export interface ProviderUptimeResponse {
  provider: string;
  uptime: UptimeDataPoint[];
  overallSuccessRate: number;
}

interface ModelProviderUptimeEntry {
  model: string;
  provider: string;
  uptime: UptimeDataPoint[];
  overallSuccessRate: number;
}

export interface ModelProviderUptimeResponse {
  uptime: ModelProviderUptimeEntry[];
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

// More granular buckets for uptime data (every 3 days for 1 year = ~122 bars)
const UPTIME_TIME_CONFIG = {
  "24h": { interval: "INTERVAL 1 DAY", bucket: "INTERVAL 1 HOUR" },
  "7d": { interval: "INTERVAL 7 DAY", bucket: "INTERVAL 6 HOUR" },
  "30d": { interval: "INTERVAL 30 DAY", bucket: "INTERVAL 1 DAY" },
  "3m": { interval: "INTERVAL 3 MONTH", bucket: "INTERVAL 1 DAY" },
  "1y": { interval: "INTERVAL 1 YEAR", bucket: "INTERVAL 3 DAY" },
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
      ? top9Data.map((r) => `'${r.model}'`).join(",") 
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

  async getAuthorStats(
    author: string,
    timeframe: StatsTimeFrame
  ): Promise<Result<AuthorStatsResponse, string>> {
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

    const authorModels = (modelsResult.data ?? [])
      .filter((row) => registry.getAuthorByModel(row.model) === author)
      .sort((a, b) => Number(b.total_tokens) - Number(a.total_tokens));

    if (authorModels.length === 0) {
      return ok({
        author,
        totalTokens: 0,
        timeSeries: [],
        leaderboard: [],
      });
    }

    const authorTotal = authorModels.reduce((sum, row) => sum + Number(row.total_tokens), 0);
    const top9Models = authorModels.slice(0, 9);
    const top9Set = new Set(top9Models.map((r) => r.model));

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

    const prevTokensMap = new Map<string, number>();
    for (const row of prevModelsResult.data ?? []) {
      if (registry.getAuthorByModel(row.model) === author) {
        prevTokensMap.set(row.model, Number(row.total_tokens));
      }
    }

    const leaderboard: ModelUsageLeaderboardEntry[] = [];
    let otherTokens = 0;
    let prevOtherTokens = 0;

    for (let i = 0; i < authorModels.length; i++) {
      const { model, total_tokens } = authorModels[i];
      const currentTokens = Number(total_tokens);

      if (i < 9) {
        const prevTokens = prevTokensMap.get(model);
        leaderboard.push({
          rank: i + 1,
          model,
          author,
          totalTokens: currentTokens,
          percentChange:
            prevTokens && prevTokens > 0
              ? ((currentTokens - prevTokens) / prevTokens) * 100
              : null,
        });
      } else {
        otherTokens += currentTokens;
        prevOtherTokens += prevTokensMap.get(model) ?? 0;
      }
    }

    if (authorModels.length > 9) {
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
    }

    const timeSeriesMap = new Map<string, Map<string, number>>();
    for (const row of timeSeriesResult.data ?? []) {
      if (registry.getAuthorByModel(row.model) !== author) continue;
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

    return ok({ author, totalTokens: authorTotal, timeSeries, leaderboard });
  }

  async getProviderStats(
    provider: string,
    timeframe: StatsTimeFrame
  ): Promise<Result<ProviderStatsResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];
    const escapedProvider = provider.replace(/'/g, "''");

    const top9Query = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
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
    if (top9Data.length === 0) {
      return ok({
        provider,
        totalTokens: 0,
        timeSeries: [],
        leaderboard: [],
      });
    }

    const top9Set = new Set(top9Data.map((r) => r.model));
    const inClause = top9Data.map((r) => `'${r.model}'`).join(",");

    const otherQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
        AND model NOT IN (${inClause})
    `;

    const totalQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
    `;

    const prevTop9Query = `
      SELECT model, sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval}
        AND hour < now() - ${interval}
        AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
        AND model IN (${inClause})
      GROUP BY model
    `;

    const prevOtherQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} - ${interval}
        AND hour < now() - ${interval}
        AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
        AND model NOT IN (${inClause})
    `;

    const timeSeriesQuery = `
      SELECT
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        model,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
      GROUP BY time_bucket, model
    `;

    const [otherResult, totalResult, prevTop9Result, prevOtherResult, timeSeriesResult] =
      await Promise.all([
        clickhouseDb.dbQuery<{ total_tokens: number }>(otherQuery, []),
        clickhouseDb.dbQuery<{ total_tokens: number }>(totalQuery, []),
        clickhouseDb.dbQuery<{ model: string; total_tokens: number }>(prevTop9Query, []),
        clickhouseDb.dbQuery<{ total_tokens: number }>(prevOtherQuery, []),
        clickhouseDb.dbQuery<{ time_bucket: string; model: string; total_tokens: number }>(timeSeriesQuery, []),
      ]);

    if (otherResult.error) return err(otherResult.error);
    if (totalResult.error) return err(totalResult.error);
    if (prevTop9Result.error) return err(prevTop9Result.error);
    if (prevOtherResult.error) return err(prevOtherResult.error);
    if (timeSeriesResult.error) return err(timeSeriesResult.error);

    const providerTotal = Number(totalResult.data?.[0]?.total_tokens ?? 0);

    const prevTokensMap = new Map<string, number>();
    for (const row of prevTop9Result.data ?? []) {
      prevTokensMap.set(row.model, Number(row.total_tokens));
    }
    const prevOtherTokens = Number(prevOtherResult.data?.[0]?.total_tokens ?? 0);

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

    if (otherTokens > 0) {
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
    }

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

    return ok({ provider, totalTokens: providerTotal, timeSeries, leaderboard });
  }

  async getModelStats(
    model: string,
    timeframe: StatsTimeFrame
  ): Promise<Result<ModelStatsResponse, string>> {
    const { interval, bucket } = TIME_CONFIG[timeframe];
    const escapedModel = model.replace(/'/g, "''");

    const totalQuery = `
      SELECT sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND model = '${escapedModel}'
    `;

    const timeSeriesQuery = `
      SELECT
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        sum(${TOTAL_TOKENS_EXPR}) as total_tokens
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND model = '${escapedModel}'
      GROUP BY time_bucket
      ORDER BY time_bucket
    `;

    const [totalResult, timeSeriesResult] = await Promise.all([
      clickhouseDb.dbQuery<{ total_tokens: number }>(totalQuery, []),
      clickhouseDb.dbQuery<{ time_bucket: string; total_tokens: number }>(timeSeriesQuery, []),
    ]);

    if (totalResult.error) return err(totalResult.error);
    if (timeSeriesResult.error) return err(timeSeriesResult.error);

    const totalTokens = Number(totalResult.data?.[0]?.total_tokens ?? 0);

    const timeSeries = (timeSeriesResult.data ?? []).map((row) => ({
      time: row.time_bucket,
      totalTokens: Number(row.total_tokens),
    }));

    return ok({ model, totalTokens, timeSeries });
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

  /**
   * Get uptime/success rate data for a specific provider over the given timeframe.
   */
  async getProviderUptime(
    provider: string,
    timeframe: StatsTimeFrame
  ): Promise<Result<ProviderUptimeResponse, string>> {
    const { interval, bucket } = UPTIME_TIME_CONFIG[timeframe];
    const escapedProvider = provider.replace(/'/g, "''");

    const uptimeQuery = `
      SELECT
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        sum(total_requests) as total_requests,
        sum(successful_requests) as successful_requests
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
        AND provider = '${escapedProvider}'
      GROUP BY time_bucket
      ORDER BY time_bucket
    `;

    const uptimeResult = await clickhouseDb.dbQuery<{
      time_bucket: string;
      total_requests: number;
      successful_requests: number;
    }>(uptimeQuery, []);

    if (uptimeResult.error) return err(uptimeResult.error);

    const uptime: UptimeDataPoint[] = (uptimeResult.data ?? []).map((row) => {
      const total = Number(row.total_requests);
      const successful = Number(row.successful_requests);
      return {
        time: row.time_bucket,
        totalRequests: total,
        successfulRequests: successful,
        successRate: total > 0 ? (successful / total) * 100 : 0,
      };
    });

    // Calculate overall success rate
    const totalRequests = uptime.reduce((sum, d) => sum + d.totalRequests, 0);
    const totalSuccessful = uptime.reduce((sum, d) => sum + d.successfulRequests, 0);
    const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;

    return ok({ provider, uptime, overallSuccessRate });
  }

  /**
   * Get uptime/success rate data for model-provider pairs.
   * Used on model detail pages to show uptime per provider.
   */
  async getModelProviderUptime(
    timeframe: StatsTimeFrame
  ): Promise<Result<ModelProviderUptimeResponse, string>> {
    const { interval, bucket } = UPTIME_TIME_CONFIG[timeframe];

    const uptimeQuery = `
      SELECT
        toStartOfInterval(hour, ${bucket}, 'UTC') as time_bucket,
        model,
        provider,
        sum(total_requests) as total_requests,
        sum(successful_requests) as successful_requests
      FROM request_stats
      WHERE hour >= now() - ${interval} AND ${BASE_WHERE_CLAUSE}
      GROUP BY time_bucket, model, provider
      ORDER BY time_bucket
    `;

    const uptimeResult = await clickhouseDb.dbQuery<{
      time_bucket: string;
      model: string;
      provider: string;
      total_requests: number;
      successful_requests: number;
    }>(uptimeQuery, []);

    if (uptimeResult.error) return err(uptimeResult.error);

    // Group by model-provider pair
    const modelProviderMap = new Map<string, {
      model: string;
      provider: string;
      dataPoints: { time: string; total: number; successful: number }[];
    }>();

    for (const row of uptimeResult.data ?? []) {
      const key = `${row.model}::${row.provider}`;
      if (!modelProviderMap.has(key)) {
        modelProviderMap.set(key, {
          model: row.model,
          provider: row.provider,
          dataPoints: [],
        });
      }
      modelProviderMap.get(key)!.dataPoints.push({
        time: row.time_bucket,
        total: Number(row.total_requests),
        successful: Number(row.successful_requests),
      });
    }

    // Convert to response format
    const uptime: ModelProviderUptimeEntry[] = [];
    for (const entry of modelProviderMap.values()) {
      const uptimeData: UptimeDataPoint[] = entry.dataPoints.map((d) => ({
        time: d.time,
        totalRequests: d.total,
        successfulRequests: d.successful,
        successRate: d.total > 0 ? (d.successful / d.total) * 100 : 0,
      }));

      const totalRequests = entry.dataPoints.reduce((sum, d) => sum + d.total, 0);
      const totalSuccessful = entry.dataPoints.reduce((sum, d) => sum + d.successful, 0);
      const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;

      uptime.push({
        model: entry.model,
        provider: entry.provider,
        uptime: uptimeData,
        overallSuccessRate,
      });
    }

    return ok({ uptime });
  }
}
