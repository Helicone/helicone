import { Experiment } from "../../controllers/public/experimentController";
import { dbExecute } from "../shared/db/dbExecute";
import { resultMap } from "../shared/result";
import { BaseStore } from "./baseStore";

function getExperimentsQuery(filter?: string, limit?: number) {
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

export const ServerExperimentStore = {
  getLatestExperiment: async () => {
    return resultMap(
      await dbExecute<{
        jsonb_build_object: Experiment;
      }>(getExperimentsQuery(undefined, 1), []),
      (d) => d[0].jsonb_build_object
    );
  },
};
