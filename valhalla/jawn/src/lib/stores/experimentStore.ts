import { ENVIRONMENT } from "../..";
import { getAllSignedURLsFromInputs } from "../../managers/inputs/InputsManager";
import { costOfPrompt } from "../../packages/cost";
import { supabaseServer } from "../db/supabase";
import { dbExecute } from "../shared/db/dbExecute";
import { FilterNode } from "../shared/filters/filterDefs";
import { buildFilterPostgres } from "../shared/filters/filters";
import { Result, err, ok, promiseResultMap, resultMap } from "../shared/result";
import { BaseStore } from "./baseStore";
import { RequestResponseBodyStore } from "./request/RequestResponseBodyStore";

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

export interface Score {
  valueType: string;
  value: number | Date | string;
}

export interface ExperimentDatasetRow {
  rowId: string;
  inputRecord: {
    id: string;
    requestId: string;
    requestPath: string;
    inputs: Record<string, string>;
    autoInputs: Record<string, string>[];
    response: ResponseObj;
    request: RequestObj;
  };
  rowIndex: number;
  columnId: string;
  scores: Record<string, Score>;
}

export interface Experiment {
  id: string;
  organization: string;
  dataset: {
    id: string;
    name: string;
    rows: ExperimentDatasetRow[];
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
      response?: ResponseObj;
      scores: Record<string, Score>;
      request?: RequestObj;
    }[];
  }[];
  scores: ExperimentScores | null;
}

export interface ExperimentScores {
  dataset: {
    scores: Record<string, Score>;
  };
  hypothesis: {
    scores: Record<string, Score>;
  };
}

export interface IncludeExperimentKeys {
  inputs?: true;
  promptVersion?: true;
  responseBodies?: true;
  score?: true;
}

export interface ExperimentTableColumn {
  id: string;
  columnName: string;
  columnType: string;
  hypothesisId?: string;
  cells: {
    rowIndex: number;
    requestId?: string;
    value: string | null;
  }[];
}

export interface ExperimentTable {
  id: string;
  name: string;
  experimentId: string;
  columns: ExperimentTableColumn[];
}

function getExperimentsQuery(
  filter?: string,
  limit?: number,
  include?: IncludeExperimentKeys
) {
  const responseObjectString = (filter: string) => {
    return `(
      SELECT jsonb_build_object(
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
                        'id', pir.id,
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
                        'inputs', pir.inputs,
                        'autoInputs', pir.auto_prompt_inputs
                      )
                      FROM prompt_input_record pir
                      left join request re on re.id = pir.source_request
                      WHERE pir.id = dsr.input_record
                      AND re.helicone_org_id = e.organization
                    ),`
                        : ""
                    }
                    'rowId', dsr.id,
                    'scores', (
                      SELECT jsonb_object_agg(
                        sa.score_key,
                        jsonb_build_object(
                          'value', sv.int_value,
                          'valueType', sa.value_type
                        )
                      )
                      FROM score_value sv
                      JOIN score_attribute sa ON sa.id = sv.score_attribute
                      JOIN prompt_input_record pir ON pir.source_request = sv.request_id
                      WHERE pir.id = dsr.input_record
                      AND sa.organization = e.organization
                    )
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
                        AND pv_parent.minor_version = 0
                        and pv_parent.major_version = pv_current.major_version
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
                                  'resultRequestId', hr.result_request_id,
                                  'scores', (
                                    SELECT jsonb_object_agg(
                                      sa.score_key,
                                      jsonb_build_object(
                                        'value', sv.int_value,
                                        'valueType', sa.value_type
                                      )
                                    )
                                    FROM score_value sv
                                    JOIN score_attribute sa ON sa.id = sv.score_attribute
                                    WHERE sv.request_id = hr.result_request_id
                                    AND sa.organization = e.organization
                                  )
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
        LEFT JOIN helicone_dataset ds ON e.dataset = ds.id
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
  const bodyStore = new RequestResponseBodyStore(experiment.organization);

  if (include.inputs) {
    for (const row of experiment.dataset.rows) {
      if (row.inputRecord) {
        row.inputRecord.inputs = await getAllSignedURLsFromInputs(
          row.inputRecord.inputs,
          experiment.organization,
          row.inputRecord.requestId
        );
        if (include.responseBodies) {
          row.inputRecord.response.body = await (
            await bodyStore.getRequestResponseBody(row.inputRecord.requestId)
          ).data?.response;
        }
      }
    }
  }

  if (include.responseBodies) {
    for (const hypothesis of experiment.hypotheses) {
      for (const run of hypothesis?.runs ?? []) {
        if (run.response) {
          run.response.body = await (
            await bodyStore.getRequestResponseBody(run.resultRequestId)
          ).data?.response;
        }
      }
    }
  }

  if (include.responseBodies) {
    const experimentScores = getExperimentScores(experiment);
    if (experimentScores.data) {
      experiment.scores = experimentScores.data;
    }
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

    const experimentResults = await Promise.all(
      experiments.data!.map((d) => enrichExperiment(d, include))
    );
    return ok(experimentResults);
  }

  async createNewExperimentTable(
    datasetId: string,
    experimentMetadata: Record<string, string>
  ): Promise<
    Result<{ experimentTableId: string; experimentId: string }, string>
  > {
    const result = await supabaseServer.client
      .from("experiment_v2")
      .insert({
        dataset: datasetId,
        organization: this.organizationId,
        meta: experimentMetadata,
      })
      .select("*")
      .single();
    if (result.error || !result.data) {
      return err(result.error?.message ?? "Failed to create experiment table");
    }
    const experimentTable = await supabaseServer.client
      .from("experiment_table")
      .insert({
        experiment_id: result.data.id,
        name: "Experiment Table",
        organization_id: this.organizationId,
      })
      .select("*")
      .single();
    if (experimentTable.error || !experimentTable.data) {
      return err(
        experimentTable.error?.message ?? "Failed to create experiment table"
      );
    }
    return ok({
      experimentTableId: experimentTable.data.id,
      experimentId: result.data.id,
    });
  }

  async createExperimentTableColumn(
    experimentTableId: string,
    columnName: string,
    columnType: "input" | "output" | "experiment",
    hypothesisId?: string
  ): Promise<Result<{ id: string }, string>> {
    const result = await supabaseServer.client
      .from("experiment_column")
      .insert({
        table_id: experimentTableId,
        column_name: columnName,
        column_type: columnType,
        hypothesis_id: hypothesisId,
        metadata: hypothesisId ? { hypothesisId: hypothesisId } : null,
      })
      .select("*")
      .single();
    if (result.error || !result.data) {
      return err(
        result.error?.message ?? "Failed to create experiment table column"
      );
    }
    return ok({ id: result.data.id });
  }

  async createExperimentTableColumns(
    experimentTableId: string,
    columns: {
      name: string;
      type: "input" | "output" | "experiment";
      hypothesisId?: string;
    }[]
  ): Promise<Result<{ ids: string[] }, string>> {
    const results = await Promise.all(
      columns.map((column) =>
        this.createExperimentTableColumn(
          experimentTableId,
          column.name,
          column.type,
          column.hypothesisId
        )
      )
    );
    if (results.some((result) => result.error)) {
      return err("Failed to create experiment table columns");
    }
    return ok({ ids: results.map((result) => result.data!.id) });
  }

  async createExperimentCell(
    columnId: string,
    rowIndex: number,
    value: string | null
  ): Promise<Result<{ id: string }, string>> {
    const result = await supabaseServer.client
      .from("experiment_cell_value")
      .insert({
        column_id: columnId,
        row_index: rowIndex,
        value: value,
      })
      .select("*")
      .single();

    if (result.error || !result.data) {
      return err(result.error?.message ?? "Failed to create experiment cell");
    }
    return ok({ id: result.data.id });
  }

  async createExperimentTableRow(params: {
    experimentTableId: string;
    rowIndex: number;
  }): Promise<Result<{ ids: string[] }, string>> {
    // First, get all columns for this experiment table
    const columnsResult = await supabaseServer.client
      .from("experiment_column")
      .select("*")
      .eq("table_id", params.experimentTableId);

    if (columnsResult.error) {
      return err(columnsResult.error.message);
    }

    // Create empty cells for each column
    const cellPromises = columnsResult.data.map((column) =>
      this.createExperimentCell(column.id, params.rowIndex, null)
    );

    try {
      const results = await Promise.all(cellPromises);

      // Check if any cell creation failed
      const failedResults = results.filter((result) => result.error);
      if (failedResults.length > 0) {
        return err(`Failed to create cells: ${failedResults[0].error}`);
      }

      // Return the first cell's ID as the row identifier
      // Since all cells are created for the same row, any cell ID can serve as the row ID
      return ok({ ids: results.map((result) => result.data!.id) });
    } catch (error) {
      return err(`Failed to create experiment row: ${error}`);
    }
  }

  async createExperimentCells(
    cells: {
      columnId: string;
      rowIndex: number;
      value: string | null;
    }[]
  ): Promise<Result<{ ids: string[] }, string>> {
    const results = await Promise.all(
      cells.map((cell) =>
        this.createExperimentCell(cell.columnId, cell.rowIndex, cell.value)
      )
    );
    if (results.some((result) => result.error)) {
      return err("Failed to create experiment cells");
    }
    return ok({ ids: results.map((result) => result.data!.id) });
  }

  async getExperimentTableById(
    experimentId: string
  ): Promise<Result<ExperimentTable, string>> {
    const query = `
      WITH max_row_index AS (
        SELECT COALESCE(MAX(row_index), -1) as max_index
        FROM experiment_cell_value ecv
        JOIN experiment_column ec ON ec.id = ecv.column_id
        JOIN experiment_table et ON et.id = ec.table_id
        WHERE et.experiment_id = $1
      )
      SELECT 
        et.id,
        et.name,
        et.experiment_id as "experimentId",
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', ec.id,
              'columnName', ec.column_name,
              'columnType', ec.column_type,
              'hypothesisId', ec.hypothesis_id,
              'cells', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'rowIndex', row_number,
                    'requestId', (
                      SELECT ecv.request_id
                      FROM experiment_cell_value ecv
                      WHERE ecv.column_id = ec.id
                      AND ecv.row_index = row_number
                    ),
                    'value', NULL
                  )
                  ORDER BY row_number
                )
                FROM generate_series(0, (SELECT max_index FROM max_row_index)) row_number
              )
            )
            ORDER BY ec.created_at DESC
          ),
          '[]'
        ) as columns
      FROM experiment_table et
      LEFT JOIN experiment_column ec ON ec.table_id = et.id
      WHERE et.experiment_id = $1
      GROUP BY et.id, et.name, et.experiment_id;
    `;

    try {
      const { data, error } = await dbExecute<{
        id: string;
        name: string;
        experimentId: string;
        columns: ExperimentTableColumn[];
      }>(query, [experimentId]);

      if (error) {
        console.error("Query Error:", error);
        return err(error);
      }

      if (!data || data.length === 0) {
        return err("Experiment table not found");
      }

      // Sort columns by columnType: input, output, experiment
      const result = {
        ...data[0],
        columns: data[0].columns
          .sort((a, b) => {
            const order = { input: 0, output: 1, experiment: 2 };
            return (
              order[a.columnType as keyof typeof order] -
              order[b.columnType as keyof typeof order]
            );
          })
          .map((col) => ({
            ...col,
            cells: col.cells || [],
          })),
      };

      return ok(result);
    } catch (e) {
      console.error("Exception:", e);
      return err("An unexpected error occurred");
    }
  }

  async getExperimentById(
    experimentId: string,
    include: IncludeExperimentKeys
  ): Promise<Result<Experiment, string>> {
    return await ServerExperimentStore.getExperiment(experimentId, include);
  }

  async getDatasetRowsByIds(params: {
    datasetRowIds: string[];
    include?: IncludeExperimentKeys;
  }): Promise<Result<ExperimentDatasetRow[], string>> {
    const { datasetRowIds, include } = params;

    // Helper functions for building parts of the query
    const responseObjectString = () => `
    jsonb_build_object(
      'body', COALESCE(resp.body, ''),
      'createdAt', COALESCE(resp.created_at::text, ''),
      'completionTokens', COALESCE(resp.completion_tokens, 0),
      'promptTokens', COALESCE(resp.prompt_tokens, 0),
      'delayMs', COALESCE(resp.delay_ms, 0),
      'model', COALESCE(resp.model, '')
    )
  `;

    const requestObjectString = () => `
    jsonb_build_object(
      'id', req.id,
      'provider', COALESCE(req.provider, '')
    )
  `;

    const query = `
    SELECT jsonb_build_object(
      'rowId', dsr.id,
      'inputRecord', jsonb_build_object(
        'id', pir.id,
        'requestId', pir.source_request,
        'requestPath', COALESCE(req.path, ''),
        'inputs', COALESCE(pir.inputs::jsonb, '{}'::jsonb),
        'autoInputs', COALESCE(pir.auto_prompt_inputs::jsonb, '[]'::jsonb)
        ${
          include?.responseBodies
            ? `
        ,'response', ${responseObjectString()}
        ,'request', ${requestObjectString()}
        `
            : ""
        }
      )
      ${
        include?.score
          ? `
      ,'scores', COALESCE((
        SELECT jsonb_object_agg(
          sa.score_key,
          jsonb_build_object(
            'value', 
            CASE 
              WHEN sa.value_type = 'int' THEN sv.int_value::text
              WHEN sa.value_type = 'float' THEN sv.float_value::text
              WHEN sa.value_type = 'string' THEN sv.string_value
              WHEN sa.value_type = 'boolean' THEN sv.boolean_value::text
              WHEN sa.value_type = 'date' THEN sv.date_value::text
            END,
            'valueType', sa.value_type
          )
        )
        FROM score_value sv
        JOIN score_attribute sa ON sa.id = sv.score_attribute
        WHERE sv.request_id = pir.source_request
      ), '{}'::jsonb)
      `
          : ""
      }
    ) AS row_data
    FROM experiment_dataset_v2_row dsr
    LEFT JOIN prompt_input_record pir ON pir.id = dsr.input_record
    LEFT JOIN request req ON req.id = pir.source_request
    ${
      include?.responseBodies
        ? "LEFT JOIN response resp ON resp.request = pir.source_request"
        : ""
    }
    WHERE dsr.id = ANY($1::uuid[])
  `;

    try {
      const { data, error } = await dbExecute<{
        row_data: ExperimentDatasetRow;
      }>(query, [datasetRowIds]);

      if (error) {
        console.error("Query Error:", error);
        return err(error);
      }

      if (!data) {
        return err("No data returned from the query");
      }

      return ok(
        data.map((d) => {
          const row = d.row_data;
          row.inputRecord.requestPath =
            row.inputRecord.requestPath === ""
              ? `${process.env.HELICONE_WORKER_URL}/v1/chat/completions`
              : row.inputRecord.requestPath;
          return row;
        })
      );
    } catch (e) {
      console.error("Exception:", e);
      return err("An unexpected error occurred");
    }
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
  const datasetScores = getExperimentDatasetScores(experiment.dataset);
  const hypothesisScores = getExperimentHypothesisScores(
    experiment.hypotheses[0]
  );

  if (datasetScores.error || !datasetScores.data) {
    return err(datasetScores.error);
  }

  if (hypothesisScores.error || !hypothesisScores.data) {
    return err(hypothesisScores.error);
  }

  return ok({
    dataset: datasetScores.data,
    hypothesis: hypothesisScores.data,
  });
}

function getExperimentHypothesisScores(
  hypothesis: Experiment["hypotheses"][0]
): Result<ExperimentScores["hypothesis"], string> {
  try {
    const validRuns =
      hypothesis.runs?.filter((run) => run.request && run.response) ?? [];

    const { totalCost, totalLatency } = validRuns.reduce<{
      totalCost: number;
      totalLatency: number;
    }>(
      (acc, run) => {
        const cost =
          modelCost({
            model: hypothesis.model,
            provider: run.request!.provider,
            sum_prompt_tokens: run.response!.promptTokens,
            sum_completion_tokens: run.response!.completionTokens,
          }) ?? 0;

        return {
          totalCost: acc.totalCost + cost,
          totalLatency: acc.totalLatency + run.response!.delayMs,
        };
      },
      { totalCost: 0, totalLatency: 0 }
    );

    return ok({
      scores: {
        dateCreated: {
          value: new Date(hypothesis.createdAt),
          valueType: "date",
        },
        model: { value: hypothesis.model, valueType: "string" },
        cost: {
          value: validRuns.length > 0 ? totalCost / validRuns.length : 0,
          valueType: "number",
        },
        latency: {
          value: validRuns.length > 0 ? totalLatency / validRuns.length : 0,
          valueType: "number",
        },
        ...getCustomScores(hypothesis.runs?.map((run) => run.scores) ?? []),
      },
    }) as Result<ExperimentScores["hypothesis"], string>;
  } catch (error) {
    console.error("Error calculating hypothesis cost", error);
    return err("Error calculating hypothesis cost");
  }
}
function getExperimentDatasetScores(
  dataset: Experiment["dataset"]
): Result<ExperimentScores["dataset"], string> {
  try {
    const validRows = dataset.rows.filter((row) => row?.inputRecord?.response);

    const { totalCost, totalLatency, latest } = validRows.reduce<{
      totalCost: number;
      totalLatency: number;
      latest: {
        createdAt: string;
        model: string;
      };
    }>(
      ({ totalCost, totalLatency, latest }, row) => {
        const cost =
          modelCost({
            model: row.inputRecord!.response.model,
            provider: row.inputRecord!.request.provider,
            sum_prompt_tokens: row.inputRecord!.response.promptTokens,
            sum_completion_tokens: row.inputRecord!.response.completionTokens,
          }) ?? 0;

        const isCurrentNewer =
          new Date(row.inputRecord!.response.createdAt) >
          new Date(latest.createdAt);

        return {
          totalCost: totalCost + cost,
          totalLatency: totalLatency + row.inputRecord!.response.delayMs,
          latest: isCurrentNewer ? row.inputRecord!.response : latest,
        };
      },
      {
        totalCost: 0,
        totalLatency: 0,
        latest: {
          createdAt: new Date(0).toISOString(),
          model: "",
        },
      }
    );

    return ok({
      scores: {
        dateCreated: { value: new Date(latest.createdAt), valueType: "date" },
        model: { value: latest.model, valueType: "string" },
        cost: {
          value: validRows.length > 0 ? totalCost / validRows.length : 0,
          valueType: "number",
        },
        latency: {
          value: validRows.length > 0 ? totalLatency / validRows.length : 0,
          valueType: "number",
        },
        ...getCustomScores(validRows.map((row) => row.scores)),
      },
    }) as Result<ExperimentScores["dataset"], string>;
  } catch (error) {
    console.error("Error calculating dataset cost", error);
    return err("Error calculating dataset cost");
  }
}

function getCustomScores(
  scores: Record<string, Score>[]
): Record<string, Score> {
  const scoresValues = scores.reduce((acc, record) => {
    for (const key in record) {
      if (record.hasOwnProperty(key) && typeof record[key].value === "number") {
        if (!acc[key]) {
          acc[key] = { sum: 0, count: 0, valueType: record[key].valueType };
        }
        acc[key].sum += record[key].value as number;
        acc[key].count += 1;
      }
    }
    return acc;
  }, {} as Record<string, { sum: number; count: number; valueType: string }>);

  return Object.fromEntries(
    Object.entries(scoresValues).map(([key, { sum, count, valueType }]) => [
      key,
      { value: sum / count, valueType },
    ])
  );
}

function modelCost(modelRow: {
  model: string;
  provider: string;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
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
