import { BaseManager } from "./BaseManager";
import { AuthParams } from "../packages/common/auth/types";
import { Result, ok, err } from "../packages/common/result";
import { dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import { cacheResultCustom } from "../utils/cacheResult";
import { KVCache } from "../lib/cache/kvCache";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { RequestManager } from "./request/RequestManager";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { Message } from "@helicone-package/llm-mapper/types";

// 1 week cache for wrapped data - these queries are expensive!
const wrappedCache = new KVCache(7 * 24 * 60 * 60 * 1000);

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface MostExpensiveRequest {
  requestId: string;
  cost: number;
  model: string;
  provider: string;
  createdAt: string;
  promptTokens: number;
  completionTokens: number;
  conversation: {
    messages: ConversationMessage[];
    turnCount: number;
    totalWords: number;
  } | null;
}

export interface WrappedStats {
  totalRequests: number;
  topProviders: Array<{ provider: string; count: number }>;
  topModels: Array<{ model: string; count: number }>;
  totalTokens: {
    prompt: number;
    completion: number;
    cacheWrite: number;
    cacheRead: number;
    total: number;
  };
  mostExpensiveRequest: MostExpensiveRequest | null;
}

export class WrappedManager extends BaseManager {
  private readonly START_DATE = "2025-01-01 00:00:00";
  private readonly END_DATE = "2026-01-01 00:00:00";
  private requestManager: RequestManager;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.requestManager = new RequestManager(authParams);
  }

  async getWrapped2025Stats(): Promise<Result<WrappedStats, string>> {
    return cacheResultCustom(
      `wrapped-2025-${this.authParams.organizationId}`,
      () => this.computeWrapped2025Stats(),
      wrappedCache
    );
  }

  async checkHas2025Data(): Promise<Result<{ hasData: boolean }, string>> {
    return cacheResultCustom(
      `wrapped-2025-check-${this.authParams.organizationId}`,
      () => this.computeHas2025Data(),
      wrappedCache
    );
  }

  private async computeHas2025Data(): Promise<
    Result<{ hasData: boolean }, string>
  > {
    const query = `
      SELECT 1 as has_data
      FROM request_response_rmt
      WHERE organization_id = {val_0:UUID}
        AND request_created_at >= {val_1:DateTime64}
        AND request_created_at < {val_2:DateTime64}
      LIMIT 1
    `;

    const result = await dbQueryClickhouse<{ has_data: number }>(query, [
      this.authParams.organizationId,
      this.START_DATE,
      this.END_DATE,
    ]);

    if (result.error) {
      return err(result.error);
    }

    return ok({ hasData: (result.data?.length ?? 0) > 0 });
  }

  private async computeWrapped2025Stats(): Promise<Result<WrappedStats, string>> {
    const orgId = this.authParams.organizationId;

    // Run all queries in parallel for efficiency
    const [
      totalRequestsResult,
      topProvidersResult,
      topModelsResult,
      totalTokensResult,
      mostExpensiveResult,
    ] = await Promise.all([
      this.getTotalRequests(orgId),
      this.getTopProviders(orgId),
      this.getTopModels(orgId),
      this.getTotalTokens(orgId),
      this.getMostExpensiveRequest(orgId),
    ]);

    // Check for errors
    if (totalRequestsResult.error) return err(totalRequestsResult.error);
    if (topProvidersResult.error) return err(topProvidersResult.error);
    if (topModelsResult.error) return err(topModelsResult.error);
    if (totalTokensResult.error) return err(totalTokensResult.error);
    if (mostExpensiveResult.error) return err(mostExpensiveResult.error);

    const tokens = totalTokensResult.data!;

    return ok({
      totalRequests: totalRequestsResult.data!,
      topProviders: topProvidersResult.data!,
      topModels: topModelsResult.data!,
      totalTokens: {
        prompt: tokens.prompt,
        completion: tokens.completion,
        cacheWrite: tokens.cacheWrite,
        cacheRead: tokens.cacheRead,
        total: tokens.prompt + tokens.completion + tokens.cacheWrite + tokens.cacheRead,
      },
      mostExpensiveRequest: mostExpensiveResult.data!,
    });
  }

  private async getTotalRequests(orgId: string): Promise<Result<number, string>> {
    const query = `
      SELECT COUNT(DISTINCT request_id) as total_requests
      FROM request_response_rmt
      WHERE organization_id = {val_0:UUID}
        AND request_created_at >= {val_1:DateTime64}
        AND request_created_at < {val_2:DateTime64}
    `;

    const result = await dbQueryClickhouse<{ total_requests: string }>(query, [
      orgId,
      this.START_DATE,
      this.END_DATE,
    ]);

    if (result.error) return err(result.error);
    return ok(Number(result.data?.[0]?.total_requests ?? 0));
  }

  private async getTopProviders(
    orgId: string
  ): Promise<Result<Array<{ provider: string; count: number }>, string>> {
    const query = `
      SELECT
        provider,
        COUNT(DISTINCT request_id) as count
      FROM request_response_rmt
      WHERE organization_id = {val_0:UUID}
        AND request_created_at >= {val_1:DateTime64}
        AND request_created_at < {val_2:DateTime64}
        AND provider != ''
      GROUP BY provider
      ORDER BY count DESC
      LIMIT 3
    `;

    const result = await dbQueryClickhouse<{ provider: string; count: string }>(
      query,
      [orgId, this.START_DATE, this.END_DATE]
    );

    if (result.error) return err(result.error);

    return ok(
      (result.data ?? []).map((row) => ({
        provider: row.provider,
        count: Number(row.count),
      }))
    );
  }

  private async getTopModels(
    orgId: string
  ): Promise<Result<Array<{ model: string; count: number }>, string>> {
    const query = `
      SELECT
        model,
        COUNT(DISTINCT request_id) as count
      FROM request_response_rmt
      WHERE organization_id = {val_0:UUID}
        AND request_created_at >= {val_1:DateTime64}
        AND request_created_at < {val_2:DateTime64}
        AND model != ''
      GROUP BY model
      ORDER BY count DESC
      LIMIT 3
    `;

    const result = await dbQueryClickhouse<{ model: string; count: string }>(
      query,
      [orgId, this.START_DATE, this.END_DATE]
    );

    if (result.error) return err(result.error);

    return ok(
      (result.data ?? []).map((row) => ({
        model: row.model,
        count: Number(row.count),
      }))
    );
  }

  private async getTotalTokens(orgId: string): Promise<
    Result<
      {
        prompt: number;
        completion: number;
        cacheWrite: number;
        cacheRead: number;
      },
      string
    >
  > {
    const query = `
      SELECT
        SUM(COALESCE(prompt_tokens, 0)) as prompt_tokens,
        SUM(COALESCE(completion_tokens, 0)) as completion_tokens,
        SUM(COALESCE(prompt_cache_write_tokens, 0)) as cache_write_tokens,
        SUM(COALESCE(prompt_cache_read_tokens, 0)) as cache_read_tokens
      FROM request_response_rmt
      WHERE organization_id = {val_0:UUID}
        AND request_created_at >= {val_1:DateTime64}
        AND request_created_at < {val_2:DateTime64}
    `;

    const result = await dbQueryClickhouse<{
      prompt_tokens: string;
      completion_tokens: string;
      cache_write_tokens: string;
      cache_read_tokens: string;
    }>(query, [orgId, this.START_DATE, this.END_DATE]);

    if (result.error) return err(result.error);

    const row = result.data?.[0];
    return ok({
      prompt: Number(row?.prompt_tokens ?? 0),
      completion: Number(row?.completion_tokens ?? 0),
      cacheWrite: Number(row?.cache_write_tokens ?? 0),
      cacheRead: Number(row?.cache_read_tokens ?? 0),
    });
  }

  private async getMostExpensiveRequest(
    orgId: string
  ): Promise<Result<MostExpensiveRequest | null, string>> {
    // Query last 90 days only (S3 body retention limit)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().replace("T", " ").slice(0, 19);

    // Use the more recent of START_DATE or 90 days ago
    const effectiveStartDate =
      new Date(this.START_DATE) > ninetyDaysAgo
        ? this.START_DATE
        : ninetyDaysAgoStr;

    const query = `
      SELECT
        request_id,
        cost / ${COST_PRECISION_MULTIPLIER} as cost_usd,
        model,
        provider,
        request_created_at,
        COALESCE(prompt_tokens, 0) as prompt_tokens,
        COALESCE(completion_tokens, 0) as completion_tokens
      FROM request_response_rmt
      WHERE organization_id = {val_0:UUID}
        AND request_created_at >= {val_1:DateTime64}
        AND request_created_at < {val_2:DateTime64}
        AND cost > 0
      ORDER BY cost DESC
      LIMIT 1
    `;

    const result = await dbQueryClickhouse<{
      request_id: string;
      cost_usd: string;
      model: string;
      provider: string;
      request_created_at: string;
      prompt_tokens: string;
      completion_tokens: string;
    }>(query, [orgId, effectiveStartDate, this.END_DATE]);

    if (result.error) return err(result.error);

    const row = result.data?.[0];
    if (!row) return ok(null);

    // Try to fetch the request body and extract conversation
    let conversation: MostExpensiveRequest["conversation"] = null;
    try {
      const requestWithBody =
        await this.requestManager.uncachedGetRequestByIdWithBody(
          row.request_id
        );

      if (requestWithBody.data) {
        const mapped = heliconeRequestToMappedContent(requestWithBody.data);

        // Extract messages from schema
        const requestMessages = mapped.schema.request.messages ?? [];
        const responseMessages = mapped.schema.response?.messages ?? [];
        const allMessages = [...requestMessages, ...responseMessages];

        // Convert to simplified format
        const simplifiedMessages = this.extractSimplifiedMessages(allMessages);

        if (simplifiedMessages.length > 0) {
          const turnCount = simplifiedMessages.filter(
            (m) => m.role === "user"
          ).length;
          const totalWords = simplifiedMessages.reduce((total, msg) => {
            const words = (msg.content || "")
              .split(/\s+/)
              .filter(Boolean).length;
            return total + words;
          }, 0);

          conversation = {
            messages: simplifiedMessages,
            turnCount,
            totalWords,
          };
        }
      }
    } catch (e) {
      // Body fetch failed - continue without conversation
      console.error("[Wrapped] Exception fetching request body:", e);
    }

    return ok({
      requestId: row.request_id,
      cost: Number(row.cost_usd),
      model: row.model,
      provider: row.provider,
      createdAt: row.request_created_at,
      promptTokens: Number(row.prompt_tokens),
      completionTokens: Number(row.completion_tokens),
      conversation,
    });
  }

  private extractSimplifiedMessages(messages: Message[]): ConversationMessage[] {
    const result: ConversationMessage[] = [];

    for (const msg of messages) {
      // Skip function/tool calls and results
      if (msg._type === "functionCall" || msg._type === "function") {
        continue;
      }

      // Handle contentArray messages (multi-part)
      if (msg._type === "contentArray" && msg.contentArray) {
        const textParts = msg.contentArray
          .filter((m) => m.content)
          .map((m) => m.content);

        if (textParts.length > 0) {
          result.push({
            role: msg.role || "user",
            content: textParts.join("\n"),
          });
        }
      } else if (msg.content && msg.role) {
        // Any message with content and role
        result.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return result;
  }
}
