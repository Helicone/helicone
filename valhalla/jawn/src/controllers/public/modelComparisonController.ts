import { Controller, Route, Security, Tags, Request, Get, Path } from "tsoa";
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

@Route("v1/public/comparison/{modelA}-vs-{modelB}")
@Tags("Comparison")
@Security("api_key")
export class ModelComparisonController extends Controller {
  @Get("")
  public async getModelComparison(
    @Request() request: JawnAuthenticatedRequest,
    @Path() modelA: string,
    @Path() modelB: string
  ): Promise<Result<ModelComparison, string>> {
    const modelComparisonManager = new ModelComparisonManager();
    const result = await modelComparisonManager.getModelComparison(
      decodeURIComponent(modelA),
      decodeURIComponent(modelB)
    );

    return result;
  }
}
