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
  medianPer1000Tokens: number;
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
  costs: {
    prompt_token: number;
    completion_token: number;
  };
  feedback: {
    positivePercentage: number;
    negativePercentage: number;
  };
  geographicLatency: {
    countryCode: string;
    median: number;
  }[];
  geographicTtft: {
    countryCode: string;
    median: number;
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

export type ModelsToCompare = {
  parent: string;
  names: string[];
  provider: string;
};

@Route("v1/public/compare")
@Tags("Comparison")
@Security("api_key")
export class ModelComparisonController extends Controller {
  @Post("/models")
  public async getModelComparison(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    modelsToCompare: ModelsToCompare[]
  ): Promise<Result<Model[], string>> {
    const modelComparisonManager = new ModelComparisonManager();

    const result = await modelComparisonManager.getModelComparison(
      modelsToCompare
    );

    console.log(`result: ${JSON.stringify(result)}`);

    return result;
  }
}
