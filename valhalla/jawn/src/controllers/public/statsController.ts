import { Controller, Get, Path, Query, Route, Tags } from "tsoa";
import { Result } from "../../packages/common/result";
import {
  AuthorStatsResponse,
  MarketShareResponse,
  ModelStatsResponse,
  ModelUsageResponse,
  ModelUsageStatsManager,
  ProviderStatsResponse,
  ProviderUsageResponse,
  ProviderUptimeResponse,
  ModelProviderUptimeResponse,
} from "../../managers/ModelUsageStatsManager";

export type StatsTimeFrame = "24h" | "7d" | "30d" | "3m" | "1y";

@Route("/v1/public/stats")
@Tags("Stats")
export class StatsController extends Controller {
  /**
   * Get model usage statistics for the AI Gateway.
   * Returns time series data and a leaderboard of top models by total tokens.
   *
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/model-usage")
  public async getModelUsage(
    @Query() timeframe: StatsTimeFrame = "7d"
  ): Promise<Result<ModelUsageResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getModelUsage(timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get market share statistics by model author for the AI Gateway.
   * Returns time series data (100% stacked) and a leaderboard of top 9 authors + others.
   *
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/market-share")
  public async getMarketShare(
    @Query() timeframe: StatsTimeFrame = "1y"
  ): Promise<Result<MarketShareResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getMarketShare(timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get provider usage statistics for the AI Gateway.
   * Returns time series data and a leaderboard of top 9 providers + others.
   *
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/provider-usage")
  public async getProviderUsage(
    @Query() timeframe: StatsTimeFrame = "7d"
  ): Promise<Result<ProviderUsageResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getProviderUsage(timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get statistics for a specific model author.
   * Returns time series data and a leaderboard of top models by that author.
   *
   * @param author The author identifier (e.g., "openai", "anthropic")
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/authors/{author}")
  public async getAuthorStats(
    @Path() author: string,
    @Query() timeframe: StatsTimeFrame = "7d"
  ): Promise<Result<AuthorStatsResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getAuthorStats(author, timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get statistics for a specific inference provider.
   * Returns time series data and a leaderboard of top models on that provider.
   *
   * @param provider The provider identifier (e.g., "openai", "anthropic")
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/providers/{provider}")
  public async getProviderStats(
    @Path() provider: string,
    @Query() timeframe: StatsTimeFrame = "7d"
  ): Promise<Result<ProviderStatsResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getProviderStats(provider, timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get usage statistics for a specific model.
   * Returns time series data showing token usage over time.
   *
   * @param model The model identifier (e.g., "gpt-4", "claude-3-opus")
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/models/{model}")
  public async getModelStats(
    @Path() model: string,
    @Query() timeframe: StatsTimeFrame = "1y"
  ): Promise<Result<ModelStatsResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getModelStats(model, timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get uptime/success rate statistics for a specific provider.
   * Returns time series data showing success rate per time bucket.
   *
   * @param provider The provider identifier (e.g., "openai", "anthropic")
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/providers/{provider}/uptime")
  public async getProviderUptime(
    @Path() provider: string,
    @Query() timeframe: StatsTimeFrame = "1y"
  ): Promise<Result<ProviderUptimeResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getProviderUptime(provider, timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Get uptime/success rate statistics for all model-provider pairs.
   * Used on model detail pages to show uptime per provider.
   *
   * @param timeframe Time range: "24h", "7d", "30d", "3m", or "1y"
   */
  @Get("/model-provider-uptime")
  public async getModelProviderUptime(
    @Query() timeframe: StatsTimeFrame = "30d"
  ): Promise<Result<ModelProviderUptimeResponse, string>> {
    const manager = new ModelUsageStatsManager();
    const result = await manager.getModelProviderUptime(timeframe);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return result;
  }
}
