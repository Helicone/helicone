import { ExperimentFilterNode } from "../../controllers/public/experimentController";
import { dbExecute } from "../shared/db/dbExecute";
import { filterListToTree } from "../shared/filters/filterDefs";
import { buildFilterPostgres } from "../shared/filters/filters";
import { Result, err, resultMap } from "../shared/result";
import { PromptVersionedStore } from "./PromptVersionedStore";
import { BaseStore } from "./baseStore";
import { DatasetStore } from "./datasetStore";
import { ExperimentHypothesisStore } from "./experimentHypothesisStore";

export interface ResponseObj {
  body: any;
  createdAt: string;
  completionTokens: number;
  promptTokens: number;
  delayMs: number;
  model: string;
}
export interface Experiment {
  id: string;
  organization: string;
  dataset: {
    id: string;
    name: string;
    rows: {
      rowId: string;
      inputRecord?: {
        requestId: string;
        requestPath: string;
        inputs: Record<string, string>;
        response: ResponseObj;
      };
    }[];
  };
  createdAt: string;
  hypotheses: {
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
  }[];
}

export interface IncludeExperimentKeys {
  inputs?: true;
  promptVersion?: true;
  responseBodies?: true;
}

function getExperimentsQuery(
  filter?: string,
  limit?: number,
  include?: IncludeExperimentKeys
) {
  const responseObjectString = (filter: string) => {
    return `(
      SELECT jsonb_build_object(
        'body', response.body,
        'createdAt', response.created_at,
        'completionTokens', response.completion_tokens,
        'promptTokens', response.prompt_tokens,
        'delayMs', response.delay_ms,
        'model', response.model
      )
      FROM response
      WHERE ${filter}
    )`;
  };

  return `
        SELECT jsonb_build_object(
          'id', e.id,
          'organization', e.organization,
          'dataset', jsonb_build_object(
              'id', ds.id,
              'name', ds.name,
              'rows', json_agg(
                  jsonb_build_object(

                    ${
                      include?.inputs
                        ? `
                    'inputRecord', (
                      SELECT jsonb_build_object(
                        ${
                          include?.responseBodies
                            ? `
                        'response', ${responseObjectString(
                          "response.request = pir.source_request"
                        )},
                        `
                            : ""
                        }
                        'requestId', pir.source_request,
                        'requestPath', re.path,
                        'inputs', pir.inputs
                      )
                      FROM prompt_input_record pir
                      left join request re on re.id = pir.source_request
                      WHERE pir.id = dsr.input_record
                      AND re.helicone_org_id = e.organization
                    ),`
                        : ""
                    }
                      'rowId', dsr.id
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
                      ${
                        include?.promptVersion
                          ? `
                      'promptVersion', (
                        SELECT jsonb_build_object(
                          'template', pv.helicone_template
                        )
                        FROM prompts_versions pv
                        WHERE pv.id = h.prompt_version
                      ),`
                          : ""
                      }
                      ${
                        include?.promptVersion
                          ? `
                      'parentPromptVersion', (
                        SELECT jsonb_build_object(
                          'template', pv_parent.helicone_template
                        )
                        FROM prompts_versions pv_current
                        JOIN prompts_versions pv_parent ON pv_parent.prompt_v2 = pv_current.prompt_v2
                        WHERE pv_current.id = h.prompt_version
                        AND pv_parent.helicone_template is not null
                        AND pv_parent.organization = e.organization
                        AND pv_current.organization = e.organization
                        AND pv_parent.major_version = 0
                        limit 1
                      ),`
                          : ""
                      }
                      'model', h.model,
                      'status', h.status,
                      'createdAt', h.created_at,
                      'runs', (
                          SELECT json_agg(
                              jsonb_build_object(
                                  ${
                                    include?.responseBodies
                                      ? `
                                  'response', ${responseObjectString(
                                    "response.request = hr.result_request_id"
                                  )},
                                  `
                                      : ""
                                  }
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
              )
              FROM experiment_v2_hypothesis h
              WHERE h.experiment_v2 = e.id
          ), '[]'::json)
        )
        FROM experiment_v2 e
        left join experiment_v2_hypothesis eh on e.id = eh.experiment_v2
        left join prompts_versions pv on pv.id = eh.prompt_version
        left join prompt_v2 p_v2 on p_v2.id = pv.prompt_v2
        LEFT JOIN experiment_dataset_v2 ds ON e.dataset = ds.id
        LEFT JOIN experiment_dataset_v2_row dsr ON dsr.dataset_id = ds.id
        ${filter ? `WHERE ${filter}` : ""}
        GROUP BY e.id, ds.id
        ORDER BY e.created_at DESC
        ${limit ? `limit ${limit}` : ""}
    `;
}

interface ExperimentBase {
  id: string;
  organization: string;
  created_at: string;
  dataset_id: string;
}

export class ExperimentStore extends BaseStore {
  async getExperimentsV2(
    filter: ExperimentFilterNode,
    include: IncludeExperimentKeys
  ) {
    // const ex
  }
  async getExperiment(
    filter: ExperimentFilterNode,
    include: IncludeExperimentKeys
  ) {
    const limit = 20;
    const experimentHypothesisStore = new ExperimentHypothesisStore(
      this.organizationId
    );
    const promptVersionedStore = new PromptVersionedStore(this.organizationId);

    const hypotheses = await experimentHypothesisStore.getHypotheses(
      filter,
      limit
    );

    const firstHypothesis = hypotheses.data![0];

    const promptVersion = await promptVersionedStore.getPromptVersion({
      prompts_versions: {
        id: {
          equals: firstHypothesis.jsonb_build_object.promptVersionId,
        },
      },
    });

    const parentPromptVersion = await promptVersionedStore.getPromptVersion(
      filterListToTree(
        [
          {
            prompts_versions: {
              major_version: {
                equals: promptVersion.data?.[0].major_version,
              },
            },
          },
          {
            prompts_versions: {
              minor_version: {
                equals: 0,
              },
            },
          },
          {
            prompts_versions: {
              prompt_v2: {
                equals: promptVersion.data?.[0].prompt_v2.id,
              },
            },
          },
        ],
        "and"
      )
    );

    const datasetStore = new DatasetStore(this.organizationId);

    // const dataset = await datasetStore.getDataset(
    //   firstHypothesis.jsonb_build_object.dataset_id
    // );
  }
  async getExperiments(
    filter: ExperimentFilterNode,
    include: IncludeExperimentKeys
  ) {
    const builtFilter = buildFilterPostgres({
      filter,
      argsAcc: [this.organizationId],
    });

    const experimentQuery = getExperimentsQuery(
      `e.organization = $1 AND ${builtFilter.filter}`,
      30,
      include
    );

    return await dbExecute<{
      jsonb_build_object: Experiment;
    }>(experimentQuery, builtFilter.argsAcc);
  }
}

export const ServerExperimentStore: {
  experimentPop: (
    include?: IncludeExperimentKeys
  ) => Promise<Result<Experiment, string>>;
  getExperiment: (
    id: string,
    include?: IncludeExperimentKeys
  ) => Promise<Result<Experiment, string>>;
  popLatestExperiment: () => Promise<
    Result<
      {
        experimentId?: string;
      },
      string
    >
  >;
} = {
  experimentPop: async (include?: IncludeExperimentKeys) => {
    const { data: experimentId, error: experimentIdError } =
      await ServerExperimentStore.popLatestExperiment();

    if (experimentIdError) {
      return err(experimentIdError);
    }

    if (!experimentId?.experimentId) {
      return err("No experiment found");
    }

    return await ServerExperimentStore.getExperiment(
      experimentId.experimentId,
      include
    );
  },
  getExperiment: async (id: string, include?: IncludeExperimentKeys) => {
    return resultMap(
      await dbExecute<{
        jsonb_build_object: Experiment;
      }>(getExperimentsQuery("e.id = $1", 1, include), [id]),
      (d) => d[0].jsonb_build_object
    );
  },

  popLatestExperiment: async () => {
    return resultMap(
      await dbExecute<{
        experiment_id?: string;
      }>(
        `
      WITH selected_experiment AS (
          SELECT experiment_v2
          FROM experiment_v2_hypothesis
          WHERE status = 'PENDING'
          ORDER BY created_at ASC
          LIMIT 1
      ), updated_experiment_hypothesis AS (
          UPDATE experiment_v2_hypothesis
          SET status = 'RUNNING'
          WHERE experiment_v2 IN (SELECT experiment_v2 FROM selected_experiment)
          RETURNING experiment_v2
      )
      SELECT experiment_v2 as experiment_id
      FROM updated_experiment_hypothesis
      LIMIT 1;      
    `,
        []
      ),
      (d) => {
        return {
          experimentId: d?.[0]?.experiment_id,
        };
      }
    );
  },
};
