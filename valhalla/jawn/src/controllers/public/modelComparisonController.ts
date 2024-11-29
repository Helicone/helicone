import {
  Controller,
  Route,
  Security,
  Tags,
  Request,
  Get,
  Path,
  Post,
  Body,
} from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { ModelComparisonManager } from "../../managers/ModelComparisonManager";

export type MetricStats = {
  average: number;
  median: number;
  min: number;
  max: number;
  p90: number;
  p95: number;
  p99: number;
};

export type TokenMetricStats = MetricStats & {
  averagePerCompletionToken: number;
};

export type TimeSeriesMetric = {
  timestamp: string;
  value: number;
};

export type Model = {
  model: string;
  provider: string;
  latency: TokenMetricStats;
  ttft: MetricStats;
  cost: {
    input: number;
    output: number;
  };
  feedback: {
    positivePercentage: number;
  };
  geographicLatency: {
    countryCode: string;
    latency: TokenMetricStats;
  }[];
  requestStatus: {
    successRate: number;
    errorRate: number;
  };
  timeSeriesData: {
    latency: TimeSeriesMetric[];
    ttft: TimeSeriesMetric[];
    successRate: TimeSeriesMetric[];
    errorRate: TimeSeriesMetric[];
  };
};

export type ModelComparison = {
  models: Model[];
};

@Route("v1/public/compare")
@Tags("Comparison")
@Security("api_key")
export class ModelComparisonController extends Controller {
  @Post("/models")
  public async getModelComparison(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      modelA: string;
      modelB: string;
    }
  ): Promise<Result<ModelComparison, string>> {
    const modelComparisonManager = new ModelComparisonManager();
    const result = await modelComparisonManager.getModelComparison(
      body.modelA,
      body.modelB
    );

    return result;
  }
}
