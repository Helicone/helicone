import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { Result } from "../../packages/common/result";
import type { JawnAuthenticatedRequest } from "../../types/request";
import {
  MetricsManager,
  MetricsDataOverTimeRequest,
  TimeIncrement,
  RequestsOverTime,
  CostOverTime,
  TokensOverTime,
  LatencyOverTime,
  TimeToFirstTokenOverTime,
  UsersOverTime,
  ThreatsOverTime,
  ErrorOverTime,
  TokensPerRequest,
  ModelMetric,
  CountryData,
  Quantiles,
} from "../../managers/MetricsManager";

// Request body types
export interface MetricsFilterBody {
  filter: FilterNode;
  timeFilter: {
    start: string;
    end: string;
  };
}

export interface MetricsOverTimeBody {
  timeFilter: {
    start: string;
    end: string;
  };
  filter: FilterNode;
  dbIncrement?: TimeIncrement;
  timeZoneDifference: number;
}

export interface RequestCountBody {
  filter: FilterNode;
  isCached?: boolean;
}

export interface ModelMetricsBody {
  filter: FilterNode;
  offset: number;
  limit: number;
  timeFilter: {
    start: string;
    end: string;
  };
}

export interface CountryMetricsBody {
  filter: FilterNode;
  offset: number;
  limit: number;
  timeFilter: {
    start: string;
    end: string;
  };
}

export interface QuantilesBody {
  filter: FilterNode;
  timeFilter: {
    start: string;
    end: string;
  };
  dbIncrement?: TimeIncrement;
  timeZoneDifference: number;
  metric: string;
}

@Route("v1/metrics")
@Tags("Metrics")
@Security("api_key")
export class MetricsController extends Controller {
  // ============== AGGREGATE METRICS ==============

  @Post("/totalRequests")
  public async getTotalRequests(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getTotalRequests(requestBody.filter, {
      start: new Date(requestBody.timeFilter.start),
      end: new Date(requestBody.timeFilter.end),
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/totalCost")
  public async getTotalCost(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getTotalCost(requestBody.filter, {
      start: new Date(requestBody.timeFilter.start),
      end: new Date(requestBody.timeFilter.end),
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/averageLatency")
  public async getAverageLatency(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getAverageLatency(requestBody.filter, {
      start: new Date(requestBody.timeFilter.start),
      end: new Date(requestBody.timeFilter.end),
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/averageTimeToFirstToken")
  public async getAverageTimeToFirstToken(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getAverageTimeToFirstToken(
      requestBody.filter,
      {
        start: new Date(requestBody.timeFilter.start),
        end: new Date(requestBody.timeFilter.end),
      }
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/averageTokensPerRequest")
  public async getAverageTokensPerRequest(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<TokensPerRequest, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getAverageTokensPerRequest(
      requestBody.filter,
      {
        start: new Date(requestBody.timeFilter.start),
        end: new Date(requestBody.timeFilter.end),
      }
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/totalThreats")
  public async getTotalThreats(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getTotalThreats(requestBody.filter, {
      start: new Date(requestBody.timeFilter.start),
      end: new Date(requestBody.timeFilter.end),
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/activeUsers")
  public async getActiveUsers(
    @Body() requestBody: MetricsFilterBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getActiveUsers(requestBody.filter, {
      start: new Date(requestBody.timeFilter.start),
      end: new Date(requestBody.timeFilter.end),
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  // ============== OVER TIME METRICS ==============

  @Post("/requestOverTime")
  public async getRequestsOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<RequestsOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getRequestsOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/costOverTime")
  public async getCostOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<CostOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getCostOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/tokensOverTime")
  public async getTokensOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<TokensOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getTokensOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/latencyOverTime")
  public async getLatencyOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<LatencyOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getLatencyOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/timeToFirstToken")
  public async getTimeToFirstTokenOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<TimeToFirstTokenOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getTimeToFirstTokenOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/usersOverTime")
  public async getUsersOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<UsersOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getUsersOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/threatsOverTime")
  public async getThreatsOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ThreatsOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getThreatsOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/errorOverTime")
  public async getErrorsOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ErrorOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getErrorsOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/requestStatusOverTime")
  public async getRequestStatusOverTime(
    @Body() requestBody: MetricsOverTimeBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<RequestsOverTime[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getRequestStatusOverTime({
      timeFilter: requestBody.timeFilter,
      userFilter: requestBody.filter,
      dbIncrement: requestBody.dbIncrement ?? "hour",
      timeZoneDifference: requestBody.timeZoneDifference,
    });
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  // ============== REQUEST COUNT (CACHED) ==============

  @Post("/requestCount")
  public async getRequestCount(
    @Body() requestBody: RequestCountBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getRequestCount(
      requestBody.filter,
      requestBody.isCached ?? false
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  // ============== MODEL METRICS ==============

  @Post("/models")
  public async getModelMetrics(
    @Body() requestBody: ModelMetricsBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelMetric[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getModelMetrics(
      requestBody.filter,
      {
        start: new Date(requestBody.timeFilter.start),
        end: new Date(requestBody.timeFilter.end),
      },
      requestBody.offset,
      requestBody.limit
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  // ============== COUNTRY METRICS ==============

  @Post("/country")
  public async getCountryMetrics(
    @Body() requestBody: CountryMetricsBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<CountryData[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getCountryMetrics(
      requestBody.filter,
      {
        start: new Date(requestBody.timeFilter.start),
        end: new Date(requestBody.timeFilter.end),
      },
      requestBody.offset,
      requestBody.limit
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  // ============== QUANTILES ==============

  @Post("/quantiles")
  public async getQuantiles(
    @Body() requestBody: QuantilesBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Quantiles[], string>> {
    const metricsManager = new MetricsManager(request.authParams);
    const result = await metricsManager.getQuantiles(
      {
        timeFilter: requestBody.timeFilter,
        userFilter: requestBody.filter,
        dbIncrement: requestBody.dbIncrement ?? "hour",
        timeZoneDifference: requestBody.timeZoneDifference,
      },
      requestBody.metric
    );
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }
}
