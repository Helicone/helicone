import { ExperimentFilterNode } from "../../controllers/public/experimentController";
import { dbExecute } from "../shared/db/dbExecute";
import { buildFilterPostgres } from "../shared/filters/filters";
import { BaseStore } from "./baseStore";

export interface ResponseObj {
  body: any;
  createdAt: string;
  completionTokens: number;
  promptTokens: number;
  delayMs: number;
  model: string;
}
export interface ExperimentHypothesis {
  id: string;
  promptVersionId: string;
  promptVersion?: {
    template: any;
  };
  parentPromptVersion?: {
    template: any;
  };
  model: string;
  status: string;
  createdAt: string;
  providerKey: string;
  runs: {
    datasetRowId: string;
    resultRequestId: string;
    response: ResponseObj;
  }[];
}

export class ExperimentHypothesisStore extends BaseStore {
  async getHypotheses(filter: ExperimentFilterNode, limit: number) {
    const builtFilter = buildFilterPostgres({
      filter,
      argsAcc: [this.organizationId],
    });

    return await dbExecute<{
      jsonb_build_object: ExperimentHypothesis;
    }>(
      `
        SELECT jsonb_build_object(
            'id', h.id,
            'providerKey', h.provider_key,
            'promptVersionId', h.prompt_version,
            'model', h.model,
            'status', h.status,
            'createdAt', h.created_at,
            'runs', (
                SELECT json_agg(
                    jsonb_build_object(
                        'datasetRowId', hr.dataset_row,
                        'resultRequestId', hr.id
                    )
                )
                FROM experiment_v2_hypothesis_run hr
                left join experiment_v2_hypothesis evh on evh.id = hr.experiment_hypothesis
                left join experiment_v2 on experiment_v2.id = evh.experiment_v2
                WHERE hr.experiment_hypothesis = h.id
                AND experiment_v2.organization = e.organization
            )
        )
        FROM experiment_v2_hypothesis h
        left join experiment_v2 e on e.id = h.experiment_v2
        WHERE (e.organization = $1) AND (${builtFilter.filter})
        ORDER BY e.created_at DESC
        ${limit ? `limit ${limit}` : ""}`,
      builtFilter.argsAcc
    );
  }
}
