import { RequestResponseRMT, clickhouseDb } from "../db/ClickhouseWrapper";
import { dbExecute } from "../shared/db/dbExecute";
import {
  err,
  resultMap,
  ok,
  Result,
  PromiseGenericResult,
} from "../shared/result";
import { BaseStore } from "./baseStore";

export type OnlineEvaluator = {
  id: string;
  evaluator_scoring_type: string;
  evaluator_name: string;
  evaluator_llm_template: string;
  config: any;
};

export class OnlineEvalStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }

  public async getOnlineEvalsByOrgId(
    orgId: string
  ): PromiseGenericResult<OnlineEvaluator[]> {
    const { data, error } = await dbExecute<OnlineEvaluator>(
      `SELECT id, evaluator.scoring_type evaluator_scoring_type, evaluator.name evaluator_name, evaluator.llm_template evaluator_llm_template, config FROM online_evaluators JOIN evaluator ON online_evaluators.evaluator = evaluator.id WHERE organization = $1`,
      [orgId]
    );

    if (error) {
      return err(error);
    }

    return ok(data ?? []);
  }
}
