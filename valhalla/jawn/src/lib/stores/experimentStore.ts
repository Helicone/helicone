import { Experiment } from "../../controllers/public/experimentController";
import { dbExecute } from "../shared/db/dbExecute";
import { Result, err, resultMap } from "../shared/result";
import { BaseStore } from "./baseStore";

function getExperimentsQuery(
  filter?: string,
  limit?: number,
  include?: {
    inputs?: boolean;
  }
) {
  return `
        SELECT jsonb_build_object(
          'id', e.id,
          'dataset', jsonb_build_object(
              'id', ds.id,
              'name', ds.name,
              'rows', json_agg(
                  jsonb_build_object(
                      'rowId', dsr.id,
                      'requestId', dsr.input_record
                      --inputs', SELECT inputs 
                      --  FROM prompt_input_record
                      --  WHERE prompt_input_record.id = dsr.input_record
                  )
              )
          ),
          'createdAt', e.created_at,
          'hypotheses', COALESCE((
              SELECT json_agg(
                  jsonb_build_object(
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
        ${filter ? `WHERE ${filter}` : ""}
        GROUP BY e.id, ds.id
        ORDER BY e.created_at DESC
        ${limit ? `limit ${limit}` : ""}
    `;
}

export class ExperimentStore extends BaseStore {
  async getExperiments() {
    return await dbExecute<{
      jsonb_build_object: Experiment;
    }>(getExperimentsQuery("e.organization = $1"), [this.organizationId]);
  }
}

export const ServerExperimentStore: {
  experimentPop: () => Promise<Result<Experiment, string>>;
  getExperiment: (id: string) => Promise<Result<Experiment, string>>;
  popLatestExperiment: () => Promise<Result<string, string>>;
} = {
  experimentPop: async () => {
    const { data: experimentId, error: experimentIdError } =
      await ServerExperimentStore.popLatestExperiment();

    if (experimentIdError) {
      return err(experimentIdError);
    }

    if (!experimentId) {
      return err("No experiment found");
    }

    return await ServerExperimentStore.getExperiment(experimentId!);
  },
  getExperiment: async (id: string) => {
    return resultMap(
      await dbExecute<{
        jsonb_build_object: Experiment;
      }>(getExperimentsQuery("e.id = $1"), [id]),
      (d) => d[0].jsonb_build_object
    );
  },

  popLatestExperiment: async () => {
    return resultMap(
      await dbExecute<{
        experimentId: string;
      }>(
        `
    WITH selected_experiment AS (
      SELECT id
      FROM experiment_v2
      AND status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT 1
    ), updated_experiment AS (
      UPDATE experiment_v2
      SET status = 'RUNNING'
      WHERE id IN (SELECT id FROM selected_experiment)
      RETURNING id
    )
    SELECT id as experimentId
    FROM updated_experiment
    `,
        []
      ),
      (d) => d[0].experimentId
    );
  },
};
