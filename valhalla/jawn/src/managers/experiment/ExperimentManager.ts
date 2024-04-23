// src/users/usersService.ts
import {
  Experiment,
  NewExperimentParams,
} from "../../controllers/public/experimentController";
import { supabaseServer } from "../../lib/db/supabase";
import { Result, err, ok } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { BaseManager } from "../BaseManager";

export class ExperimentManager extends BaseManager {
  async getExperiments(): Promise<Result<Experiment[], string>> {
    const result = await dbExecute<{
      jsonb_build_object: Experiment;
    }>(
      `
          SELECT jsonb_build_object(
            'id', e.id,
            'dataset', jsonb_build_object(
                'id', ds.id,
                'name', ds.name,
                'rows', json_agg(
                    jsonb_build_object(
                        'rowId', dsr.id,
                        'requestId', dsr.input_record
                    )
                )
            ),
            'createdAt', e.created_at,
            'hypotheses', COALESCE((
                SELECT json_agg(
                    jsonb_build_object(
                        'id', h.id,
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
                            WHERE hr.experiment_hypothesis = h.id
                        )
                    )
                )
                FROM experiment_v2_hypothesis h
                WHERE h.experiment_v2 = e.id
            ), '[]'::json)
          )
          FROM experiment_v2 e
          LEFT JOIN experiment_dataset_v2 ds ON e.dataset = ds.id
          LEFT JOIN experiment_dataset_v2_row dsr ON dsr.dataset_id = ds.id
          WHERE e.organization = $1
          GROUP BY e.id, ds.id
          ORDER BY e.created_at DESC
          limit 10;
      `,
      [this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(result.error);
    }

    return ok(result.data.map((d) => d.jsonb_build_object));
  }

  async addNewExperiment(
    params: NewExperimentParams
  ): Promise<Result<{ experimentId: string }, string>> {
    // TODO ensure that params.sourcePromptVersion matches the provided dataset for now...

    const experiment = await supabaseServer.client
      .from("experiment_v2")
      .insert({
        dataset: params.datasetId,
        organization: this.authParams.organizationId,
      })
      .select("*")
      .single();

    if (!experiment.data?.id) {
      return err("Failed to create experiment" + experiment.error?.message);
    }

    const result = await dbExecute(
      `
      INSERT INTO experiment_v2_hypothesis (
        prompt_version,
        model,
        status,
        experiment_v2
      )
      VALUES ($1, $2, $3, $4)
      `,
      [params.promptVersion, params.model, "PENDING", experiment.data.id]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok({ experimentId: experiment.data.id });
  }
}
