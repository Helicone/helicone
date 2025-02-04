import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  Eval,
  EvalManager,
  ScoreDistribution,
} from "../../managers/eval/EvalManager";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";

import { KVCache } from "../../lib/cache/kvCache";
import { cacheResultCustom } from "../../utils/cacheResult";

export type EvalFilterBranch = {
  left: EvalFilterNode;
  operator: "or" | "and";
  right: EvalFilterNode;
};
type EvalFilterNode =
  | FilterLeafSubset<"request_response_rmt">
  | EvalFilterBranch
  | "all";

export interface EvalQueryParams {
  filter: EvalFilterNode;
  timeFilter: {
    start: string;
    end: string;
  };
  offset?: number;
  limit?: number;
  timeZoneDifference?: number;
}

const kvCache = new KVCache(5 * 60 * 1000); // 5 minutes

@Route("/v1/evals")
@Tags("Evals")
@Security("api_key")
export class EvalController extends Controller {
  @Post("/query")
  public async queryEvals(
    @Body()
    evalQueryParams: EvalQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Eval[], string>> {
    const evalManager = new EvalManager(request.authParams);

    const result = await evalManager.getEvals(evalQueryParams);

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Failed to fetch evals");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Get("/scores")
  public async getEvalScores(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string[], string>> {
    const evalManager = new EvalManager(request.authParams);
    const result = await cacheResultCustom(
      "v1/evals/scores" + request.authParams.organizationId,
      async () => await evalManager.getEvalScores(),
      kvCache
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Failed to fetch eval scores");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Post("/{requestId}")
  public async addEval(
    @Path() requestId: string,
    @Body() evalData: { name: string; score: number },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evalManager = new EvalManager(request.authParams);
    const result = await evalManager.addEval(requestId, evalData);

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Post("/score-distributions/query")
  public async queryScoreDistributions(
    @Body() evalQueryParams: EvalQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ScoreDistribution[], string>> {
    const evalManager = new EvalManager(request.authParams);

    const result = await evalManager.getScoreDistributions(evalQueryParams);

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Failed to fetch score distributions");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }
}
