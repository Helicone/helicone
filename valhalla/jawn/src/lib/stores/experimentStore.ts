import { getAllSignedURLsFromInputs } from "../../managers/inputs/InputsManager";
import { dbExecute } from "../shared/db/dbExecute";
import { FilterNode } from "../shared/filters/filterDefs";
import { buildFilterPostgres } from "../shared/filters/filters";
import { Result, err, ok, promiseResultMap, resultMap } from "../shared/result";
import { BaseStore } from "./baseStore";
import { costOfPrompt } from "../../packages/cost";

export interface ResponseObj {
  body: any;
  createdAt: string;
  completionTokens: number;
  promptTokens: number;
  delayMs: number;
  model: string;
}

export interface RequestObj {
  id: string;
  provider: string;
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
        request: RequestObj;
      };
    }[];
  };
  meta: any;
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
      request: RequestObj;
    }[];
  }[];
  scores: ExperimentScores | null;
}

export interface ExperimentScores {
  dataset: {
    dateCreated: Date;
    model: string;
    cost: number;
    //customScores: Record<string, number>;
  };
  hypothesis: {
    dateCreated: Date;
    model: string;
    cost: number;
    //customScores: Record<string, number>;
  };
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

  const requestObjectString = (filter: string) => {
    return `(
      SELECT jsonb_build_object(
        'id', re.id,
        'provider', re.provider
      )
      FROM request re
      WHERE ${filter}
      LIMIT 1
    )`;
  };

  return `
        SELECT jsonb_build_object(
          'id', e.id,
          'meta', e.meta,
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
                        'request', ${requestObjectString(
                          "re.id = pir.source_request"
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
                                  'request', ${requestObjectString(
                                    "request.id = hr.result_request_id"
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
                          left join request on request.id = hr.result_request_id
                          WHERE hr.experiment_hypothesis = h.id
                          AND experiment_v2.organization = e.organization
                          AND request.id = hr.result_request_id
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

async function enrichExperiment(
  experiment: Experiment,
  include: IncludeExperimentKeys
) {
  if (include.inputs) {
    for (const row of experiment.dataset.rows) {
      if (row.inputRecord) {
        row.inputRecord.inputs = await getAllSignedURLsFromInputs(
          row.inputRecord.inputs,
          experiment.organization,
          row.inputRecord.requestId
        );
      }
    }
  }

  const experimentScores = getExperimentScores(experiment);

  if (!experimentScores.error && experimentScores.data) {
    experiment.scores = experimentScores.data;
  }

  return experiment;
}

export class ExperimentStore extends BaseStore {
  async getExperiments(
    filter: FilterNode,
    include: IncludeExperimentKeys
  ): Promise<Result<Experiment[], string>> {
    const builtFilter = buildFilterPostgres({
      filter,
      argsAcc: [this.organizationId],
    });

    const experimentQuery = getExperimentsQuery(
      `e.organization = $1 AND ${builtFilter.filter}`,
      30,
      include
    );

    const experiments = resultMap(
      await dbExecute<{
        jsonb_build_object: Experiment;
      }>(experimentQuery, builtFilter.argsAcc),
      (d) => d.map((d) => d.jsonb_build_object)
    );

    if (experiments.error) {
      return err(experiments.error);
    }

    return ok(
      await Promise.all(
        experiments.data!.map((d) => enrichExperiment(d, include))
      )
    );
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
    return promiseResultMap(
      await dbExecute<{
        jsonb_build_object: Experiment;
      }>(getExperimentsQuery("e.id = $1", 1, include), [id]),
      async (d) => enrichExperiment(d[0].jsonb_build_object, include ?? {})
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

function getExperimentScores(
  experiment: Experiment
): Result<ExperimentScores, string> {
  let totalDatasetCost = 0;
  let avgDatasetCost = 0;
  let totalHypothesisCost = 0;
  let avgHypothesisCost = 0;
  let datasetDateCreated = new Date();
  let hypothesisDateCreated = new Date();
  let datasetModel = "";
  let hypothesisModel = "";

  try {
    for (const hypothesis of experiment.hypotheses) {
      const hypothesisCost = hypothesis.runs.reduce(
        (acc, run) =>
          acc +
          modelCost({
            model: hypothesis.model,
            provider: run.request.provider,
            sum_prompt_tokens: run.response.promptTokens,
            sum_completion_tokens: run.response.completionTokens,
            sum_tokens:
              run.response.completionTokens + run.response.promptTokens,
          }),
        0
      );

      totalHypothesisCost += hypothesisCost;

      hypothesisDateCreated = new Date(hypothesis.createdAt);
      hypothesisModel = hypothesis.model;
    }
    if (experiment.hypotheses.length > 0) {
      avgHypothesisCost = totalHypothesisCost / experiment.hypotheses.length;
    }
  } catch (error) {
    console.error("Error calculating hypothesis cost", error);
    return err("Error calculating hypothesis cost");
  }

  try {
    for (const row of experiment.dataset.rows) {
      const initialRequest = row.inputRecord;
      if (!initialRequest) {
        continue;
      }

      const requestCost =
        modelCost({
          model: hypothesisModel,
          provider: initialRequest.request.provider,
          sum_prompt_tokens: initialRequest.response.promptTokens,
          sum_completion_tokens: initialRequest.response.completionTokens,
          sum_tokens:
            initialRequest.response.completionTokens +
            initialRequest.response.promptTokens,
        }) ?? 0;

      totalDatasetCost += requestCost;

      datasetDateCreated = new Date(initialRequest.response.createdAt);
      datasetModel = initialRequest.response.model;
    }
    if (experiment.dataset.rows.length > 0) {
      avgDatasetCost = totalDatasetCost / experiment.dataset.rows.length;
    }
  } catch (error) {
    console.error("Error calculating dataset cost", error);
    return err("Error calculating dataset cost");
  }

  const scores: ExperimentScores = {
    dataset: {
      dateCreated: datasetDateCreated,
      model: datasetModel,
      cost: avgDatasetCost,
    },
    hypothesis: {
      dateCreated: hypothesisDateCreated,
      model: hypothesisModel,
      cost: avgHypothesisCost,
    },
  };

  return ok(scores);
}

function modelCost(modelRow: {
  model: string;
  provider: string;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  sum_tokens: number;
}): number {
  const model = modelRow.model;
  const promptTokens = modelRow.sum_prompt_tokens;
  const completionTokens = modelRow.sum_completion_tokens;
  return (
    costOfPrompt({
      model,
      promptTokens,
      completionTokens,
      provider: modelRow.provider,
    }) ?? 0
  );
}
