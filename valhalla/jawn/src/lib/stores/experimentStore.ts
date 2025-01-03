import { ENVIRONMENT } from "../clients/constant";
import {
  getAllSignedURLsFromInputs,
  InputsManager,
} from "../../managers/inputs/InputsManager";
import { costOfPrompt } from "../../packages/cost";
import { Database } from "../db/database.types";
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
  tableId: string | null;
}

export interface ExperimentScores {
  dataset: {
    scores: Record<string, Score>;
  };
  hypothesis: {
    runsCount: number;
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
    id: string;
    rowIndex: number;
    requestId?: string;
    value: string | null;
    metadata?: Record<string, any>;
  }[];
  metadata?: Record<string, any>;
}

export interface ExperimentTable {
  id: string;
  name: string;
  experimentId: string;
  columns: ExperimentTableColumn[];
  metadata?: Record<string, any>;
}

export interface ExperimentTableSimplified {
  id: string;
  name: string;
  experimentId: string;
  createdAt: string;
  metadata?: any;
  columns: {
    id: string;
    columnName: string;
    columnType: string;
  }[];
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
    name: string,
    experimentMetadata: Record<string, string>,
    experimentTableMetadata?: Record<string, any>
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
        name: name,
        organization_id: this.organizationId,
        metadata: experimentTableMetadata ?? null,
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

  async getMaxRowIndex(
    experimentTableId: string
  ): Promise<Result<number, string>> {
    const query = `
      SELECT COALESCE(MAX(ecv.row_index), -1) as max_row_index
      FROM experiment_cell ecv
      JOIN experiment_column ec ON ec.id = ecv.column_id
      JOIN experiment_table et ON et.id = ec.table_id
      WHERE et.id = $1
    `;

    const result = await dbExecute<{ max_row_index: number }>(query, [
      experimentTableId,
    ]);

    if (result.error || result.data === null || result.data.length === 0) {
      return err(result.error ?? "Failed to get max row index");
    }

    return ok(result.data[0].max_row_index);
  }

  async createExperimentTableColumn(
    experimentTableId: string,
    columnName: string,
    columnType: "input" | "output" | "experiment",
    hypothesisId?: string,
    promptVersionId?: string,
    inputKeys?: string[]
  ): Promise<Result<{ id: string }, string>> {
    const metadata: Record<string, any> = {};
    if (hypothesisId) {
      metadata.hypothesisId = hypothesisId;
    }
    if (promptVersionId) {
      metadata.promptVersionId = promptVersionId;
    }

    // Create the column using Supabase
    const columnResult = await supabaseServer.client
      .from("experiment_column")
      .insert({
        table_id: experimentTableId,
        column_name: columnName,
        column_type: columnType,
        metadata: metadata,
      })
      .select("*")
      .single();

    if (columnResult.error || !columnResult.data) {
      return err(columnResult.error?.message ?? "Failed to create column");
    }

    // Fetch existing columns for the experiment table
    const existingColumnsResult = await supabaseServer.client
      .from("experiment_column")
      .select("id")
      .eq("table_id", experimentTableId);

    if (
      existingColumnsResult.error ||
      !existingColumnsResult.data ||
      existingColumnsResult.data.length === 0
    ) {
      return err("No existing columns found in the experiment table.");
    }

    // Use the first existing column to copy metadata from
    const existingColumnId = existingColumnsResult.data[0].id;

    // Fetch existing cells to obtain inputIds
    const existingCellsResult = await supabaseServer.client
      .from("experiment_cell")
      .select("row_index, metadata")
      .eq("column_id", existingColumnId);

    if (existingCellsResult.error || !existingCellsResult.data) {
      return err(
        existingCellsResult.error?.message ?? "Failed to fetch existing cells"
      );
    }

    // Prepare arrays to collect updates and new cells
    const inputUpdates: { inputId: string; inputs: Record<string, string> }[] =
      [];
    const newCellsData: any[] = [];

    // Iterate over existing cells
    for (const cell of existingCellsResult.data) {
      const inputId = (cell.metadata as any)?.inputId;
      if (inputId) {
        // Build the inputs object you wish to add
        const inputs = Object.fromEntries(
          (inputKeys ?? []).map((key) => [key, ""])
        );

        // Collect data for bulk input record update
        inputUpdates.push({ inputId, inputs });
      }

      // Prepare new cell data
      newCellsData.push({
        column_id: columnResult.data.id,
        row_index: cell.row_index,
        status: "initialized",
        value: null,
        //@ts-ignore
        metadata: { ...(cell.metadata ?? {}), cellType: columnType },
      });
    }

    // Insert new cells into the database
    const cellsInsertResult = await supabaseServer.client
      .from("experiment_cell")
      .insert(newCellsData);

    if (cellsInsertResult.error) {
      return err(cellsInsertResult.error.message);
    }

    // Perform bulk update of input records
    if (inputUpdates.length > 0) {
      // Build the SQL query for batch updating input records
      const updateQueries = inputUpdates
        .map((update, index) => {
          const paramIdx1 = index * 2 + 1;
          const paramIdx2 = index * 2 + 2;
          return `
          UPDATE prompt_input_record
          SET inputs = COALESCE(inputs, '{}'::jsonb) || $${paramIdx1}::jsonb
          WHERE id = $${paramIdx2};
        `;
        })
        .join("\n");

      const queryParams = inputUpdates.flatMap((update) => [
        JSON.stringify(update.inputs),
        update.inputId,
      ]);

      const result = await dbExecute<any>(updateQueries, queryParams);

      if (result.error) {
        return err(result.error ?? "Failed to update input records");
      }
    }

    return ok({ id: columnResult.data.id });
  }

  async createExperimentTableColumns(
    experimentTableId: string,
    columns: {
      name: string;
      type: "input" | "output" | "experiment";
      hypothesisId?: string;
      promptVersionId?: string;
    }[]
  ): Promise<Result<{ ids: string[] }, string>> {
    const results = await Promise.all(
      columns.map((column) =>
        this.createExperimentTableColumn(
          experimentTableId,
          column.name,
          column.type,
          column.hypothesisId,
          column.promptVersionId
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
    value: string | null,
    metadata?: Record<string, any>
  ): Promise<Result<{ id: string; cellType: string }, string>> {
    const result = await supabaseServer.client
      .from("experiment_cell")
      .insert({
        column_id: columnId,
        row_index: rowIndex,
        value: value ?? null,
        status: "initialized",
        metadata: metadata ?? null,
      })
      .select("*")
      .single();

    if (result.error || !result.data) {
      return err(result.error?.message ?? "Failed to create experiment cell");
    }
    return ok({
      id: result.data.id,
      cellType: (result.data.metadata as any)?.cellType,
    });
  }

  async getExperimentCellsByIds(cellIds: string[]): Promise<
    Result<
      {
        cellId: string;
        status: string | null;
        value: string | null;
        metadata: Record<string, any> | null;
        rowIndex: number;
        columnId: string;
      }[],
      string
    >
  > {
    const query = `
    SELECT
      ec.id,
      ec.status,
      ec.value,
      ec.metadata,
      ec.row_index,
      ec.column_id
    FROM experiment_cell ec
    WHERE ec.id = ANY($1::uuid[])
  `;
    const result = await dbExecute<{
      id: string;
      status: string | null;
      value: string | null;
      metadata: Record<string, any> | null;
      row_index: number;
      column_id: string;
    }>(query, [cellIds]);

    if (result.error || !result.data) {
      return err(result.error ?? "Failed to get experiment cells");
    }
    return ok(
      result.data.map((cell) => ({
        cellId: cell.id,
        status: cell.status,
        value: cell.value,
        metadata: cell.metadata,
        rowIndex: cell.row_index,
        columnId: cell.column_id,
      }))
    );
  }

  async updateExperimentCell(params: {
    cellId: string;
    status: string | null;
    value?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<
    Result<
      {
        cellId: string;
        status: string | null;
        value: string | null;
        metadata: Record<string, any> | null;
        columnName: string;
      },
      string
    >
  > {
    const { cellId, status, value, metadata } = params;

    // Build the updates dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (status !== null && status !== undefined && status !== "") {
      updates.push(`status = $${index++}`);
      values.push(status);
    }

    if (value !== null && value !== undefined && value !== "") {
      updates.push(`value = $${index++}`);
      values.push(value);
    }

    if (metadata) {
      // Use jsonb concatenation operator to merge existing and new metadata
      updates.push(
        `metadata = COALESCE(ec.metadata, '{}'::jsonb) || $${index++}::jsonb`
      );
      values.push(JSON.stringify(metadata));
    }

    if (updates.length === 0) {
      return err("No fields to update");
    }

    const query = `
      UPDATE experiment_cell ec
      SET ${updates.join(", ")}
      FROM experiment_column col
      WHERE ec.id = $${index}
        AND ec.column_id = col.id
      RETURNING ec.id, ec.status, ec.value, ec.metadata, col.column_name;
    `;

    values.push(cellId);

    const result = await dbExecute<{
      id: string;
      status: string | null;
      value: string | null;
      metadata: Record<string, any> | null;
      column_name: string;
    }>(query, values);

    if (result.error || !result.data || result.data.length === 0) {
      return err(result.error ?? "Failed to update experiment cell");
    }

    return ok({
      cellId: result.data[0].id,
      status: result.data[0].status,
      value: result.data[0].value,
      metadata: result.data[0].metadata,
      columnName: result.data[0].column_name,
    });
  }

  async updateExperimentCells(params: {
    cells: {
      cellId: string;
      status: string | null;
      value?: string | null;
      metadata?: Record<string, any> | null;
    }[];
  }): Promise<
    Result<
      {
        cellId: string;
        status: string | null;
        value?: string | null;
        metadata?: Record<string, any> | null;
        columnName: string;
      }[],
      string
    >
  > {
    const results = await Promise.all(
      params.cells.map((cell) => this.updateExperimentCell(cell))
    );
    if (results.some((result) => result.error)) {
      return err("Failed to update experiment cell statuses");
    }
    return ok(results.map((result) => result.data!));
  }

  async createExperimentTableRow(params: {
    experimentTableId: string;
    rowIndex: number;
    metadata?: Record<string, any>;
    inputs?: Record<string, string>;
  }): Promise<Result<{ id: string; cellType: string }[], string>> {
    // First, get all columns for this experiment table
    const columnsResult = await supabaseServer.client
      .from("experiment_column")
      .select("*")
      .eq("table_id", params.experimentTableId);

    if (columnsResult.error) {
      return err(columnsResult.error.message);
    }

    // Create empty cells for each column
    let cellPromises: Promise<
      Result<{ id: string; cellType: string }, string>
    >[] = [];

    if (params.inputs && Object.keys(params.inputs).length > 0) {
      cellPromises = columnsResult.data.map((column) =>
        this.createExperimentCell(
          column.id,
          params.rowIndex,
          params?.inputs?.[column.column_name] ?? null,
          {
            ...params.metadata,
            cellType: column.column_type,
          }
        )
      );
    } else {
      columnsResult.data.map((column) =>
        this.createExperimentCell(column.id, params.rowIndex, null, {
          ...params.metadata,
          cellType: column.column_type,
        })
      );
    }

    try {
      const results = await Promise.all(cellPromises);

      // Check if any cell creation failed
      const failedResults = results.filter((result) => result.error);
      if (failedResults.length > 0) {
        return err(`Failed to create cells: ${failedResults[0].error}`);
      }

      // Return the first cell's ID as the row identifier
      // Since all cells are created for the same row, any cell ID can serve as the row ID
      return ok(
        results.map((result) => ({
          id: result.data!.id,
          cellType: result.data!.cellType,
        }))
      );
    } catch (error) {
      return err(`Failed to create experiment row: ${error}`);
    }
  }

  async softDeleteExperimentTableRow(params: {
    experimentTableId: string;
    rowIndex: number;
  }): Promise<Result<null, string>> {
    const { experimentTableId, rowIndex } = params;

    try {
      const query = `
        UPDATE experiment_cell AS ec
        SET metadata = COALESCE(ec.metadata, '{}'::jsonb) || '{"deleted": true}'::jsonb
        FROM experiment_column AS col
        WHERE ec.column_id = col.id
          AND col.table_id = $1
          AND ec.row_index = $2
      `;

      const result = await dbExecute(query, [experimentTableId, rowIndex]);

      if (result.error) {
        return err(`Failed to soft delete row ${rowIndex}: ${result.error}`);
      }

      return ok(null);
    } catch (error) {
      console.error(`Error soft deleting experiment table row: ${error}`);
      return err(`Error soft deleting row ${rowIndex}: ${error}`);
    }
  }

  async createExperimentCells(
    cells: {
      columnId: string;
      rowIndex: number;
      value: string | null;
      metadata?: Record<string, any>;
    }[]
  ): Promise<Result<{ ids: string[] }, string>> {
    const results = await Promise.all(
      cells.map((cell) =>
        this.createExperimentCell(
          cell.columnId,
          cell.rowIndex,
          cell.value === null || cell.value === "" ? null : cell.value,
          cell.metadata
        )
      )
    );
    if (results.some((result) => result.error)) {
      return err("Failed to create experiment cells");
    }
    return ok({ ids: results.map((result) => result.data!.id) });
  }

  async getExperimentHypothesisScores(params: {
    hypothesisId: string;
  }): Promise<Result<ExperimentScores["hypothesis"], string>> {
    const { hypothesisId } = params;

    const query = `
      WITH latest_runs AS (
        SELECT DISTINCT ON (hr.dataset_row) 
          hr.result_request_id,
          hr.dataset_row,
          r.created_at
        FROM experiment_v2_hypothesis_run hr
        JOIN request r ON r.id = hr.result_request_id
        WHERE hr.experiment_hypothesis = $1 
        AND r.helicone_org_id = $2
        ORDER BY hr.dataset_row, r.created_at DESC
      )
      SELECT 
        hr.result_request_id,
        r.provider,
        r.model,
        r.created_at,
        resp.completion_tokens, 
        resp.prompt_tokens, 
        resp.delay_ms,
        COALESCE(
          (
            SELECT jsonb_object_agg(
              sa.score_key,
              jsonb_build_object(
                'value', sv.int_value,
                'valueType', sa.value_type
              )
            )
            FROM score_value sv
            JOIN score_attribute sa ON sa.id = sv.score_attribute
            WHERE sv.request_id = r.id and sa.organization = $2
          ),
          '{}'::jsonb
        ) as scores
      FROM latest_runs lr
      JOIN experiment_v2_hypothesis_run hr ON hr.result_request_id = lr.result_request_id
      JOIN request r ON r.id = hr.result_request_id
      JOIN response resp ON resp.request = r.id
      WHERE hr.experiment_hypothesis = $1 
      AND r.helicone_org_id = $2
    `;

    const result = await dbExecute<{
      result_request_id: string;
      provider: string;
      model: string;
      created_at: string;
      completion_tokens: number;
      prompt_tokens: number;
      delay_ms: number;
      scores: Record<string, Score>;
    }>(query, [hypothesisId, this.organizationId]);

    if (result.error) {
      return err(result.error);
    }

    const runs = result.data;

    if (!runs || runs.length === 0) {
      return ok({
        runsCount: 0,
        scores: {
          model: { value: "No data", valueType: "string" },
          cost: { value: -1, valueType: "number" },
          latency: { value: -1, valueType: "number" },
        },
      });
    }

    try {
      const totalCost = runs.reduce((sum, run) => {
        const cost =
          modelCost({
            model: run.model,
            provider: run.provider,
            sum_prompt_tokens: run.prompt_tokens,
            sum_completion_tokens: run.completion_tokens,
          }) ?? 0;
        return sum + cost;
      }, 0);

      const totalLatency = runs.reduce((sum, run) => sum + run.delay_ms, 0);

      // Collect the custom scores from each run
      const customScoresArray = runs.map((run) => run.scores);

      const customScores = getCustomScores(customScoresArray);

      const scores: ExperimentScores["hypothesis"] = {
        runsCount: runs.length,
        scores: {
          dateCreated: {
            value: new Date(runs[0].created_at),
            valueType: "date",
          },
          model: { value: runs[0].model, valueType: "string" },
          cost: {
            value: totalCost / runs.length,
            valueType: "number",
          },
          latency: {
            value: totalLatency / runs.length,
            valueType: "number",
          },
          ...customScores,
        },
      };

      return ok(scores);
    } catch (error) {
      console.error("Error calculating hypothesis scores", error);
      return err("Error calculating hypothesis scores");
    }
  }

  async getExperimentTable(
    experimentTableId: string
  ): Promise<Result<ExperimentTable, string>> {
    const query = `
      SELECT 
        et.id,
        et.name,
        et.experiment_id as "experimentId",
        et.metadata,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', ec.id,
              'columnName', ec.column_name,
              'columnType', ec.column_type,
              'metadata', ec.metadata,
              'cells', (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', ecv.id,
                    'rowIndex', ecv.row_index,
                    'value', ecv.value,
                    'status', ecv.status,
                    'metadata', CASE 
                      WHEN ecv.metadata IS NULL THEN NULL 
                      ELSE ecv.metadata::jsonb 
                    END
                  )
                  ORDER BY ecv.row_index
                )
                FROM experiment_cell ecv
                WHERE ecv.column_id = ec.id
              )
            )
            ORDER BY 
              CASE 
                WHEN ec.column_type = 'input' THEN 1
                WHEN ec.column_type = 'output' THEN 2
                WHEN ec.column_type = 'experiment' THEN 3
                ELSE 4
              END,
              ec.created_at ASC
          ),
          '[]'
        ) as columns
      FROM experiment_table et
      LEFT JOIN experiment_column ec ON ec.table_id = et.id
      WHERE et.id = $1 AND et.organization_id = $2
      GROUP BY et.id, et.name, et.experiment_id, et.metadata;
    `;

    try {
      const { data, error } = await dbExecute<{
        id: string;
        name: string;
        experimentId: string;
        columns: ExperimentTableColumn[];
      }>(query, [experimentTableId, this.organizationId]);

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

  async getExperimentTableById(
    experimentTableId: string
  ): Promise<Result<ExperimentTableSimplified, string>> {
    const result = await supabaseServer.client
      .from("experiment_table")
      .select(
        `
        id,
        name,
        experiment_id,
        metadata,
        created_at,
        experiment_column (
          id,
          column_name,
          column_type,
          metadata
        )
      `
      )
      .eq("id", experimentTableId)
      .eq("organization_id", this.organizationId)
      .single();

    if (result.error || !result.data) {
      return err(result.error?.message ?? "Experiment table not found");
    }

    const columns = result.data.experiment_column.map((col: any) => ({
      id: col.id,
      columnName: col.column_name,
      columnType: col.column_type,
      metadata: col.metadata,
    }));

    return ok({
      id: result.data.id,
      name: result.data.name,
      experimentId: result.data.experiment_id,
      metadata: result.data.metadata,
      createdAt: result.data.created_at,
      columns: columns,
    });
  }

  async getExperimentTableColumns(
    experimentTableId: string
  ): Promise<Result<Array<{ id: string; name: string }>, string>> {
    const result = await supabaseServer.client
      .from("experiment_column")
      .select("id, column_name")
      .eq("table_id", experimentTableId);

    if (result.error || !result.data) {
      return err(result.error?.message ?? "Experiment columns not found");
    }

    const columns = result.data.map((col: any) => ({
      id: col.id,
      name: col.column_name,
    }));

    return ok(columns);
  }

  async updateExperimentTableMetadata(params: {
    experimentTableId: string;
    metadata: Record<string, any>;
  }): Promise<Result<null, string>> {
    const existingMetadata = await this.getExperimentTable(
      params.experimentTableId
    );
    const result = await supabaseServer.client
      .from("experiment_table")
      .update({
        metadata: {
          ...existingMetadata.data?.metadata,
          ...params.metadata,
        },
      })
      .eq("id", params.experimentTableId)
      .eq("organization_id", this.organizationId);

    if (result.error) {
      return err(result.error.message);
    }
    return ok(null);
  }

  async getExperimentTables(): Promise<
    Result<ExperimentTableSimplified[], string>
  > {
    const { data, error } = await supabaseServer.client
      .from("experiment_table")
      .select("*")
      .eq("organization_id", this.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return err(error.message);
    }

    return ok(
      data.map((table) => ({
        id: table.id,
        name: table.name,
        experimentId: table.experiment_id,
        metadata: table.metadata,
        createdAt: table.created_at,
        columns: [],
      }))
    );
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

  async createExperimentTableRowWithCells(params: {
    experimentTableId: string;
    rowIndex: number;
    metadata?: Record<string, any>;
    cells: {
      columnId: string;
      value: string | null;
      metadata?: Record<string, any>;
    }[];
  }): Promise<Result<{ ids: string[] }, string>> {
    // Fetch all columns for the experiment table
    const columnsResult = await supabaseServer.client
      .from("experiment_column")
      .select("id")
      .eq("table_id", params.experimentTableId);

    if (columnsResult.error) {
      return err(columnsResult.error.message);
    }

    const allColumnIds = columnsResult.data.map((col) => col.id);

    // Create cells for specified columns
    const cellPromises = params.cells.map((cell) =>
      this.createExperimentCell(
        cell.columnId,
        params.rowIndex,
        cell.value,
        cell.metadata ?? params.metadata
      )
    );

    // Create empty cells for other columns
    const specifiedColumnIds = params.cells.map((cell) => cell.columnId);
    const otherColumnIds = allColumnIds.filter(
      (id) => !specifiedColumnIds.includes(id)
    );

    for (const columnId of otherColumnIds) {
      cellPromises.push(
        this.createExperimentCell(
          columnId,
          params.rowIndex,
          null,
          params.metadata
        )
      );
    }

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

  async createExperimentTableRowsWithCells(params: {
    experimentTableId: string;
    rows: {
      metadata?: Record<string, any>;
      cells: {
        columnId: string;
        value: string | null;
        metadata?: Record<string, any>;
      }[];
      sourceRequest?: string;
    }[];
  }): Promise<Result<{ ids: string[] }, string>> {
    // Fetch all columns for the experiment table
    const columnsResult = await supabaseServer.client
      .from("experiment_column")
      .select("*")
      .eq("table_id", params.experimentTableId);

    if (columnsResult.error) {
      return err(columnsResult.error.message);
    }

    const allColumns = columnsResult.data.map((col) => col);

    // Get the current max row index
    const maxRowIndexResult = await this.getMaxRowIndex(
      params.experimentTableId
    );
    if (maxRowIndexResult.error || maxRowIndexResult.data === null) {
      return err(maxRowIndexResult.error ?? "Failed to get max row index");
    }

    let currentRowIndex = maxRowIndexResult.data + 1;

    // Collect all cells to create
    const cellsToCreate: {
      columnId: string;
      rowIndex: number;
      value: string | null;
      metadata?: Record<string, any>;
      sourceRequest?: string;
    }[] = [];

    for (const row of params.rows) {
      // Create cells for specified columns
      const specifiedColumnIds = row.cells.map((cell) => cell.columnId);
      const otherColumnIds = allColumns.filter(
        (col) => !specifiedColumnIds.includes(col.id)
      );

      // Cells for specified columns
      for (const cell of row.cells) {
        cellsToCreate.push({
          columnId: cell.columnId,
          rowIndex: currentRowIndex,
          value: cell.value,
          metadata: cell.metadata ?? row.metadata,
        });
      }

      // Cells for other columns (empty)
      for (const columnId of otherColumnIds) {
        cellsToCreate.push({
          columnId: columnId.id,
          rowIndex: currentRowIndex,
          value:
            columnId.column_type === "output"
              ? row.sourceRequest ?? null
              : null,
          metadata: {
            ...row.metadata,
            cellType: "output",
          },
        });
      }
      console.log("cellsToCreate", cellsToCreate);

      // Increment rowIndex for next row
      currentRowIndex++;
    }

    // Now, bulk insert all cells
    try {
      const results = await this.createExperimentCells(cellsToCreate);

      if (results.error) {
        return err(results.error);
      }

      // Return the IDs of the created cells
      return ok({ ids: results.data?.ids ?? [] });
    } catch (error) {
      return err(`Failed to create experiment rows: ${error}`);
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
