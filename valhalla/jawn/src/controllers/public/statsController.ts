import { Controller, Get, Query, Route, Tags } from "tsoa";
import { Result } from "../../packages/common/result";
import {
  MarketShareResponse,
  ModelUsageResponse,
  ModelUsageStatsManager,
  ProviderUsageResponse,
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
}
