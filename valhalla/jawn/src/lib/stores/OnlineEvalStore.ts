import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, PromiseGenericResult, Result } from "../shared/result";
import { BaseStore } from "./baseStore";

export type EvaluatorConfig = {
  evaluator_scoring_type: string;
  evaluator_llm_template?: string;
  evaluator_code_template?: string;
};

export type OnlineEvaluatorByOrgId = {
  id: string;
  evaluator_id: string;
  evaluator_name: string;
  evaluator_created_at: string;
  config: any;
} & EvaluatorConfig;

export type OnlineEvaluatorByEvaluatorId = {
  id: string;
  config: any;
};

export class OnlineEvalStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }
  public async hasOnlineEvals(orgId: string): Promise<Result<boolean, string>> {
    const { data, error } = await dbExecute<{
      count: number;
    }>(`SELECT COUNT(*) FROM online_evaluators WHERE organization = $1`, [
      orgId,
    ]);

    if (error) {
      return ok(false);
    }

    return ok(data![0].count > 0);
  }

  public async getOnlineEvalsByOrgId(
    orgId: string
  ): PromiseGenericResult<OnlineEvaluatorByOrgId[]> {
    const { data, error } = await dbExecute<OnlineEvaluatorByOrgId>(
      `SELECT 
        online_evaluators.id,
        evaluator.id as evaluator_id,
        evaluator.scoring_type as evaluator_scoring_type,
        evaluator.name as evaluator_name,
        evaluator.llm_template as evaluator_llm_template,
        evaluator.code_template as evaluator_code_template,
        evaluator.created_at as evaluator_created_at,
        online_evaluators.config
      FROM online_evaluators 
      JOIN evaluator ON online_evaluators.evaluator = evaluator.id 
      WHERE online_evaluators.organization = $1`,
      [orgId]
    );

    if (error) {
      return err(error);
    }

    return ok(data ?? []);
  }

  public async getOnlineEvaluatorsByEvaluatorId(
    evaluatorId: string
  ): PromiseGenericResult<OnlineEvaluatorByEvaluatorId[]> {
    const { data, error } = await dbExecute<OnlineEvaluatorByOrgId>(
      `SELECT 
        online_evaluators.id,
        online_evaluators.config
      FROM online_evaluators 
      WHERE online_evaluators.evaluator = $1`,
      [evaluatorId]
    );

    if (error) {
      return err(error);
    }

    return ok(data ?? []);
  }

  public async deleteOnlineEvaluator(
    onlineEvaluatorId: string
  ): PromiseGenericResult<null> {
    const { error } = await dbExecute(
      `DELETE FROM online_evaluators WHERE id = $1`,
      [onlineEvaluatorId]
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }
}
