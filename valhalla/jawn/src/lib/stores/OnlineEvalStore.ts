import { dbExecute } from "../shared/db/dbExecute";
import {
  err,
  ok,
  PromiseGenericResult,
  Result,
} from "../../packages/common/result";
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
  last_mile_config: any;
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
    }>(
      `SELECT COUNT(*) as count FROM online_evaluators WHERE organization = $1`,
      [orgId]
    );

    if (error) {
      return ok(false);
    }

    return ok((data?.[0]?.count ?? 0) > 0);
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
        online_evaluators.config,
        evaluator.last_mile_config as last_mile_config
      FROM online_evaluators 
      JOIN evaluator ON online_evaluators.evaluator = evaluator.id
        AND evaluator.organization_id = online_evaluators.organization
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
      WHERE online_evaluators.evaluator = $1
      AND online_evaluators.organization = $2`,
      [evaluatorId, this.organizationId]
    );

    if (error) {
      return err(error);
    }

    return ok(data ?? []);
  }

  /**
   * Creates an online evaluator for an evaluator owned by this store's org.
   * Returns an error (without inserting) if the evaluator is not owned by the
   * organization, so one tenant can never schedule another tenant's evaluator.
   */
  public async createOnlineEvaluator(
    evaluatorId: string,
    config: Record<string, any>
  ): PromiseGenericResult<null> {
    const { data, error } = await dbExecute<{ id: string }>(
      `INSERT INTO online_evaluators (evaluator, organization, config)
       SELECT evaluator.id, $2, $3
       FROM evaluator
       WHERE evaluator.id = $1 AND evaluator.organization_id = $2
       RETURNING id`,
      [evaluatorId, this.organizationId, JSON.stringify(config)]
    );

    if (error) {
      return err(error);
    }

    if (!data || data.length === 0) {
      return err("Evaluator not found");
    }

    return ok(null);
  }

  public async deleteOnlineEvaluator(
    onlineEvaluatorId: string,
    evaluatorId: string
  ): PromiseGenericResult<null> {
    const { error } = await dbExecute(
      `DELETE FROM online_evaluators
       WHERE id = $1 AND evaluator = $2 AND organization = $3`,
      [onlineEvaluatorId, evaluatorId, this.organizationId]
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }
}
