import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Eval, EvalManager } from "../../managers/eval/EvalManager";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";

import { KVCache } from "../../lib/cache/kvCache";
import { cacheResultCustom } from "../../utils/cacheResult";

export type RequestFilterBranch = {
  left: RequestFilterNode;
  operator: "or" | "and";
  right: RequestFilterNode;
};
type RequestFilterNode =
  | FilterLeafSubset<"request_response_rmt">
  | RequestFilterBranch
  | "all";

export interface EvalQueryParams {
  filter: RequestFilterBranch;
  offset?: number;
  limit?: number;
}

const kvCache = new KVCache(5 * 60 * 1000); // 5 minutes

@Route("/v1/evals")
@Tags("Evals")
@Security("api_key")
export class EvalController extends Controller {
  @Post("/query")
  public async queryEvals(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    queryParams: EvalQueryParams
  ): Promise<Result<Eval[], string>> {
    const evalManager = new EvalManager(request.authParams);
    console.log(queryParams);
    const result = await evalManager.getEvals();

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
}
