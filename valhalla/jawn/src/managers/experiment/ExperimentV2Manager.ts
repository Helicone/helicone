import {
  CreateNewPromptVersionForExperimentParams,
  ExperimentV2,
  ExperimentV2PromptVersion,
  ExperimentV2Row,
  ExtendedExperimentData,
} from "../../controllers/public/experimentV2Controller";
import { PromptVersionResult } from "../../controllers/public/promptController";
import { run } from "../../lib/experiment/run";
import { AuthParams } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { ExperimentStore } from "../../lib/stores/experimentStore";
import { BaseManager } from "../BaseManager";
import { InputsManager } from "../inputs/InputsManager";
import { PromptManager } from "../prompt/PromptManager";
import { RequestManager } from "../request/RequestManager";

export interface ScoreV2 {
  valueType: string;
  value: number | Date | string;
  max: number;
  min: number;
}

export interface ExperimentOutputForScores {
  request_id: string;
  input_record: {
    inputs: Record<string, string>;
    autoInputs: Record<string, string>;
  };
  scores: Record<string, ScoreV2>;
}

function getCustomScores(
  scores: Record<string, ScoreV2>[],
): Record<string, ScoreV2> {
  const scoresValues = scores.reduce(
    (acc, record) => {
      for (const key in record) {
        if (
          record.hasOwnProperty(key) &&
          typeof record[key].value === "number"
        ) {
          if (!acc[key]) {
            acc[key] = {
              sum: 0,
              count: 0,
              valueType: record[key].valueType,
              max: record[key].value as number,
              min: record[key].value as number,
            };
          }
          acc[key].sum += record[key].value as number;
          acc[key].count += 1;
          acc[key].max = Math.max(acc[key].max, record[key].value as number);
          acc[key].min = Math.min(acc[key].min, record[key].value as number);
        }
      }
      return acc;
    },
    {} as Record<
      string,
      {
        sum: number;
        count: number;
        valueType: string;
        max: number;
        min: number;
      }
    >,
  );

  return Object.fromEntries(
    Object.entries(scoresValues).map(
      ([key, { sum, count, valueType, max, min }]) => [
        key,
        { value: sum / count, valueType, max, min },
      ],
    ),
  );
}

export class ExperimentV2Manager extends BaseManager {
  private ExperimentStore: ExperimentStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.ExperimentStore = new ExperimentStore(authParams.organizationId);
  }

  async getPromptVersionFromRequest(
    requestId: string,
  ): Promise<Result<string, string>> {
    const requestManager = new RequestManager(this.authParams);
    const requestResult = await requestManager.getRequestById(requestId);
    if (requestResult.error || !requestResult.data) {
      return err(requestResult.error);
    }

    try {
      const result = await dbExecute<{ prompt_version: string }>(
        `SELECT prompt_version
         FROM prompt_input_record
         WHERE source_request = $1
         LIMIT 1`,
        [requestId],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to get prompt version from request");
      }

      return ok(result.data[0].prompt_version);
    } catch (error) {
      return err(`Error retrieving prompt version: ${error}`);
    }
  }

  async hasAccessToExperiment(experimentId: string): Promise<boolean> {
    try {
      const result = await dbExecute<{ id: string }>(
        `SELECT id
         FROM experiment_v3
         WHERE id = $1
         AND organization = $2
         LIMIT 1`,
        [experimentId, this.authParams.organizationId],
      );

      return !!(result.data && result.data.length > 0);
    } catch (error) {
      console.error("Error checking experiment access:", error);
      return false;
    }
  }

  async getExperiments(): Promise<Result<ExperimentV2[], string>> {
    try {
      const result = await dbExecute<ExperimentV2>(
        `SELECT *
         FROM experiment_v3
         WHERE organization = $1
         AND soft_delete = false
         ORDER BY created_at DESC`,
        [this.authParams.organizationId],
      );

      if (result.error) {
        return err(`Failed to get experiments: ${result.error}`);
      }

      return ok(result.data || []);
    } catch (error) {
      return err(`Failed to get experiments: ${error}`);
    }
  }

  async getExperimentById(experimentId: string): Promise<ExperimentV2 | null> {
    try {
      const result = await dbExecute<ExperimentV2>(
        `SELECT *
         FROM experiment_v3
         WHERE id = $1
         AND organization = $2
         LIMIT 1`,
        [experimentId, this.authParams.organizationId],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return null;
      }

      return result.data[0];
    } catch (error) {
      console.error("Error fetching experiment by ID:", error);
      return null;
    }
  }

  async deleteExperiment(experimentId: string): Promise<Result<null, string>> {
    const experiment = await this.hasAccessToExperiment(experimentId);
    if (!experiment) {
      return err("Experiment not found");
    }

    try {
      const result = await dbExecute(
        `UPDATE experiment_v3
         SET soft_delete = true
         WHERE id = $1
         AND organization = $2`,
        [experimentId, this.authParams.organizationId],
      );

      if (result.error) {
        return err(`Failed to delete experiment: ${result.error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to delete experiment: ${error}`);
    }
  }

  // this query needs to be better imo
  async createNewExperiment(
    name: string,
    originalPromptVersion: string,
  ): Promise<Result<{ experimentId: string }, string>> {
    try {
      const promptManager = new PromptManager(this.authParams);
      const originalPromptVersionRes = await promptManager.getPromptVersions({
        prompts_versions: {
          id: {
            equals: originalPromptVersion,
          },
        },
      });

      if (originalPromptVersionRes.error || !originalPromptVersionRes.data) {
        return err("Failed to get original prompt version");
      }

      if (originalPromptVersionRes.data[0].minor_version !== 0) {
        return err("Original prompt version is not a major prompt version");
      }

      const originalPromptVersionData = originalPromptVersionRes.data[0];

      // Get input keys for the prompt version
      const inputKeysResult = await dbExecute<{ key: string }>(
        `SELECT key
         FROM prompt_input_keys
         WHERE prompt_version = $1`,
        [originalPromptVersion],
      );

      // Create new experiment
      const experimentResult = await dbExecute<{ id: string }>(
        `INSERT INTO experiment_v3 (name, original_prompt_version, organization, input_keys)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          name,
          originalPromptVersion,
          this.authParams.organizationId,
          inputKeysResult.data?.map((row) => row.key) || [],
        ],
      );

      if (
        experimentResult.error ||
        !experimentResult.data ||
        experimentResult.data.length === 0
      ) {
        return err(
          `Failed to create new experiment: ${experimentResult.error}`,
        );
      }

      const experimentId = experimentResult.data[0].id;

      // Create new prompt version for the experiment
      const newPromptVersion = await promptManager.createNewPromptVersion(
        originalPromptVersion,
        {
          newHeliconeTemplate: originalPromptVersionData.helicone_template,
          experimentId: experimentId,
          metadata: {
            label: "Original",
          },
        },
      );

      if (newPromptVersion.error || !newPromptVersion.data) {
        return err("Failed to create new prompt version");
      }

      // Update experiment with copied original prompt version
      const updateResult = await dbExecute(
        `UPDATE experiment_v3
         SET copied_original_prompt_version = $1
         WHERE id = $2`,
        [newPromptVersion.data.id, experimentId],
      );

      if (updateResult.error) {
        return err(`Failed to update experiment: ${updateResult.error}`);
      }

      return ok({ experimentId });
    } catch (error) {
      return err(`Failed to create new experiment: ${error}`);
    }
  }

  async getExperimentWithRowsById(
    experimentId: string,
  ): Promise<Result<ExtendedExperimentData, string>> {
    try {
      const experimentResult = await dbExecute<ExperimentV2>(
        `SELECT *
         FROM experiment_v3
         WHERE id = $1
         AND organization = $2
         LIMIT 1`,
        [experimentId, this.authParams.organizationId],
      );

      if (
        experimentResult.error ||
        !experimentResult.data ||
        experimentResult.data.length === 0
      ) {
        return err("Experiment not found");
      }

      const rows = await dbExecute<ExperimentV2Row>(
        `
        SELECT 
          pir.id,
          pir.inputs,
          pir.prompt_version,
          pir.auto_prompt_inputs,
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', eo.id,
                  'request_id', eo.request_id,
                  'is_original', eo.is_original,
                  'prompt_version_id', eo.prompt_version_id,
                  'input_record_id', eo.input_record_id,
                  'created_at', eo.created_at
                )
                ORDER BY eo.created_at DESC
              )
              FROM experiment_output eo 
              WHERE pir.id = eo.input_record_id
            ),
            '[]'::jsonb
          ) AS requests
        FROM prompt_input_record pir
        WHERE pir.experiment_id = $1
        ORDER BY pir.created_at ASC
        `,
        [experimentId],
      );

      if (rows.error || !rows.data) {
        return err(`Failed to get experiment rows: ${rows.error}`);
      }

      return ok({
        ...experimentResult.data[0],
        rows: rows.data,
      });
    } catch (error) {
      return err(`Failed to get experiment: ${error}`);
    }
  }

  async getExperimentOutputForScores(
    experimentId: string,
  ): Promise<Result<ExperimentOutputForScores[], string>> {
    try {
      const rows = await dbExecute<ExperimentOutputForScores>(
        `
    SELECT 
      eo.request_id as request_id,
      jsonb_build_object(
        'id', pir.id,
        'inputs', pir.inputs,
        'autoInputs', pir.auto_prompt_inputs
      ) as input_record,
      COALESCE((
          SELECT jsonb_object_agg(
            sa.score_key,
            jsonb_build_object(
              'value', 
              CASE 
                WHEN sa.value_type = 'int' THEN sv.int_value::text
                WHEN sa.value_type = 'number' THEN sv.int_value::text
                WHEN sa.value_type = 'boolean' THEN sv.int_value::text
              END,
              'valueType', sa.value_type
            )
          )
          FROM score_value sv
          JOIN score_attribute sa ON sa.id = sv.score_attribute
          WHERE sv.request_id = eo.request_id
        ), '{}'::jsonb) as scores
    FROM experiment_output eo
    JOIN prompt_input_record pir ON pir.id = eo.input_record_id
    WHERE eo.experiment_id = $1
        `,
        [experimentId],
      );

      if (rows.error || !rows.data) {
        return err("Failed to get experiment");
      }

      return ok(rows.data ?? []);
    } catch (e) {
      return err("Failed to get experiment");
    }
  }

  async createNewPromptVersionForExperiment(
    experimentId: string,
    requestBody: CreateNewPromptVersionForExperimentParams,
  ): Promise<Result<PromptVersionResult, string>> {
    try {
      const promptManager = new PromptManager(this.authParams);
      const result = await promptManager.createNewPromptVersion(
        requestBody.parentPromptVersionId,
        requestBody,
      );

      if (result.error || !result.data) {
        return err("Failed to create new prompt version");
      }

      const newPromptVersionInputKeys = Array.from(
        JSON.stringify(result.data.helicone_template).matchAll(
          /<helicone-prompt-input key=\\"(\w+)\\" \/>/g,
        ),
      ).map((match) => match[1]);

      // Get existing input keys
      const existingKeysResult = await dbExecute<{ input_keys: string[] }>(
        `SELECT input_keys
         FROM experiment_v3
         WHERE id = $1
         LIMIT 1`,
        [experimentId],
      );

      const existingInputKeys = existingKeysResult.data?.[0]?.input_keys || [];

      // Update experiment input keys
      const updateExperimentResult = await dbExecute(
        `UPDATE experiment_v3
         SET input_keys = $1
         WHERE organization = $2
         AND id = $3`,
        [
          [...new Set([...existingInputKeys, ...newPromptVersionInputKeys])],
          this.authParams.organizationId,
          experimentId,
        ],
      );

      const insertPromptKeysResult = await dbExecute(
        `INSERT INTO prompt_input_keys (key, prompt_version)
         SELECT unnest($1::text[]), $2
         ON CONFLICT (key, prompt_version) DO NOTHING`,
        [`{${newPromptVersionInputKeys.join(",")}}`, result.data.id],
      );

      if (updateExperimentResult.error || insertPromptKeysResult.error) {
        return err("Failed to update experiment input keys");
      }

      return ok(result.data);
    } catch (error) {
      return err(
        `Failed to create new prompt version for experiment: ${error}`,
      );
    }
  }

  async deletePromptVersion(
    experimentId: string,
    promptVersionId: string,
  ): Promise<Result<null, string>> {
    const experiment = await this.hasAccessToExperiment(experimentId);
    if (!experiment) {
      return err("You do not have access to this experiment");
    }

    const promptManager = new PromptManager(this.authParams);
    const result = await promptManager.removePromptVersionFromExperiment(
      promptVersionId,
      experimentId,
    );
    if (result.error) {
      return err("Failed to delete prompt version");
    }
    return ok(null);
  }

  async getPromptVersionsForExperiment(
    experimentId: string,
  ): Promise<Result<ExperimentV2PromptVersion[], string>> {
    try {
      const result = await dbExecute<ExperimentV2PromptVersion>(
        `SELECT *
         FROM prompts_versions
         WHERE experiment_id = $1
         AND organization = $2
         ORDER BY minor_version ASC`,
        [experimentId, this.authParams.organizationId],
      );

      if (result.error) {
        return err(`Failed to get prompt versions: ${result.error}`);
      }

      return ok(result.data || []);
    } catch (error) {
      return err(`Failed to get prompt versions: ${error}`);
    }
  }

  async getInputKeysForExperiment(
    experimentId: string,
  ): Promise<Result<string[], string>> {
    try {
      const result = await dbExecute<{ input_keys: string[] }>(
        `SELECT input_keys
         FROM experiment_v3
         WHERE id = $1
         AND organization = $2
         LIMIT 1`,
        [experimentId, this.authParams.organizationId],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return ok([]);
      }

      return ok(result.data[0].input_keys || []);
    } catch (error) {
      return err(`Failed to get input keys: ${error}`);
    }
  }

  async addManualRowToExperiment(
    experimentId: string,
    inputs: Record<string, string>,
  ): Promise<Result<string, string>> {
    try {
      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        return err("Experiment not found");
      }

      const inputManager = new InputsManager(this.authParams);
      const result = await inputManager.createInputRecord(
        experiment.copied_original_prompt_version ?? "",
        inputs,
        undefined,
        experimentId,
      );
      if (result.error || !result.data) {
        return err("Failed to add manual row to experiment");
      }
      return ok(result.data);
    } catch (e) {
      return err("Failed to add manual row to experiment");
    }
  }

  async addManualRowsToExperimentBatch(
    experimentId: string,
    inputs: Record<string, string>[],
  ): Promise<Result<null, string>> {
    try {
      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        return err("Experiment not found");
      }

      const inputManager = new InputsManager(this.authParams);
      await inputManager.createInputRecords(
        experiment.copied_original_prompt_version ?? "",
        inputs,
        undefined,
        experimentId,
      );

      return ok(null);
    } catch (e) {
      return err("Failed to create experiment table row batch");
    }
  }

  async createExperimentTableRowBatch(
    experimentId: string,
    rows: {
      inputRecordId: string;
      inputs: Record<string, string>;
      autoInputs: Record<string, any>;
    }[],
  ): Promise<Result<null, string>> {
    try {
      await Promise.all(
        rows.map(async (row) => {
          await this.createExperimentTableRow(
            experimentId,
            row.inputRecordId,
            row.inputs,
            row.autoInputs,
          );
        }),
      );

      return ok(null);
    } catch (e) {
      return err("Failed to create experiment table row with cells batch");
    }
  }

  async createExperimentTableRowBatchFromDataset(
    experimentId: string,
    datasetId: string,
  ): Promise<Result<null, string>> {
    const experiment = await this.getExperimentById(experimentId);
    if (!experiment) {
      return err("Experiment not found");
    }

    const inputManager = new InputsManager(this.authParams);
    const inputRecords =
      await inputManager.getInputsFromPromptVersionAndDataset(
        experiment.original_prompt_version ?? "",
        datasetId,
      );

    if (!inputRecords.data) {
      return err("No input records found");
    }

    try {
      await Promise.all(
        (inputRecords.data ?? []).map(async (row) => {
          await this.createExperimentTableRow(
            experimentId,
            row.id,
            row.inputs,
            row.auto_prompt_inputs,
          );
        }),
      );

      return ok(null);
    } catch (error) {
      return err(
        `Failed to create experiment table row with cells batch: ${error}`,
      );
    }
  }

  async createExperimentTableRow(
    experimentId: string,
    inputRecordId: string,
    inputs: Record<string, string>,
    autoInputs: Record<string, any>,
  ): Promise<Result<null, string>> {
    try {
      // Get the original prompt input record
      const originalPIRResult = await dbExecute<{ source_request: string }>(
        `SELECT source_request
         FROM prompt_input_record
         WHERE id = $1
         LIMIT 1`,
        [inputRecordId],
      );

      if (
        originalPIRResult.error ||
        !originalPIRResult.data ||
        originalPIRResult.data.length === 0
      ) {
        return err("Original prompt input record not found");
      }

      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        return err("Experiment not found");
      }

      // Create new prompt input record
      const newPIRResult = await dbExecute<{ id: string }>(
        `INSERT INTO prompt_input_record (
           inputs, 
           auto_prompt_inputs, 
           prompt_version, 
           experiment_id
         )
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          inputs,
          autoInputs,
          experiment.copied_original_prompt_version || "",
          experimentId,
        ],
      );

      if (
        newPIRResult.error ||
        !newPIRResult.data ||
        newPIRResult.data.length === 0
      ) {
        return err("Failed to create prompt input record");
      }

      // Create experiment output
      const outputResult = await dbExecute(
        `INSERT INTO experiment_output (
           input_record_id,
           prompt_version_id,
           is_original,
           experiment_id,
           request_id
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newPIRResult.data[0].id,
          experiment.copied_original_prompt_version || "",
          true,
          experimentId,
          originalPIRResult.data[0].source_request,
        ],
      );

      if (outputResult.error) {
        return err(`Failed to create experiment output: ${outputResult.error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to create experiment table row: ${error}`);
    }
  }

  async deleteExperimentTableRows(
    experimentId: string,
    inputRecordIds: string[],
  ): Promise<Result<null, string>> {
    const experiment = await this.getExperimentById(experimentId);
    if (!experiment) {
      return err("Experiment not found");
    }

    if (inputRecordIds.length === 0) {
      return err("No input record ids provided");
    }

    try {
      // Create placeholders for the IN clause
      const placeholders = inputRecordIds.map((_, i) => `$${i + 3}`).join(", ");

      const result = await dbExecute(
        `UPDATE prompt_input_record
         SET experiment_id = null
         WHERE id IN (${placeholders})
         AND experiment_id = $1`,
        [experimentId, ...inputRecordIds],
      );

      if (result.error) {
        return err(`Failed to delete experiment table rows: ${result.error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to delete experiment table rows: ${error}`);
    }
  }

  async updateExperimentTableRow(
    experimentId: string,
    inputRecordId: string,
    inputs: Record<string, string>,
  ): Promise<Result<null, string>> {
    try {
      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        return err("Experiment not found");
      }

      const result = await dbExecute(
        `UPDATE prompt_input_record
         SET inputs = $1
         WHERE id = $2
         AND experiment_id = $3`,
        [inputs, inputRecordId, experimentId],
      );

      if (result.error) {
        return err(`Failed to update experiment table row: ${result.error}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to update experiment table row: ${error}`);
    }
  }

  async runHypothesis(
    experimentId: string,
    promptVersionId: string,
    inputRecordId: string,
  ): Promise<Result<string, string>> {
    try {
      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        return err("Experiment not found");
      }
      const result = await run(
        experimentId,
        promptVersionId,
        inputRecordId,
        this.authParams.organizationId,
      );

      return result;
    } catch (e) {
      return err("Failed to run hypothesis" + JSON.stringify(e));
    }
  }

  async getExperimentPromptVersionScores(
    experimentId: string,
    promptVersionId: string,
  ): Promise<Result<Record<string, ScoreV2>, string>> {
    const experiment = await this.hasAccessToExperiment(experimentId);
    if (!experiment) {
      return err("Unauthorized");
    }

    const rows = await dbExecute<{ scores: Record<string, ScoreV2> }>(
      `SELECT
       COALESCE((
        SELECT jsonb_object_agg(
          sa.score_key,
          jsonb_build_object(
            'value', sv.int_value,
            'valueType', sa.value_type
          )
        ) 
      FROM score_value sv
      JOIN score_attribute sa ON sa.id = sv.score_attribute
      JOIN evaluator_experiments_v3 ee ON ee.experiment = $1
      JOIN evaluator e ON e.id = ee.evaluator
      WHERE sv.request_id = eo.request_id
      AND sa.score_key = REGEXP_REPLACE(LOWER(REPLACE(e.name, ' ', '_')), '[^a-z0-9]+', '_', 'g') || 
          CASE WHEN sa.value_type = 'boolean' THEN '-hcone-bool' ELSE '' END
      ), '{}'::jsonb) as scores
    FROM experiment_output eo
    WHERE eo.experiment_id = $1
    AND eo.prompt_version_id = $2
    `,
      [experimentId, promptVersionId],
    );

    const scoresArray = rows.data?.map((row) => row.scores) ?? [];

    const scores = getCustomScores(scoresArray);

    return ok(scores);
  }

  async getExperimentRequestScore(
    experimentId: string,
    requestId: string,
    scoreKey: string,
  ): Promise<Result<ScoreV2 | null, string>> {
    const rows = await dbExecute<{ score: ScoreV2 }>(
      `SELECT jsonb_build_object(
          'value', sv.int_value,
          'valueType', sa.value_type
        ) as score
      FROM score_value sv
      JOIN score_attribute sa ON sa.id = sv.score_attribute
      LEFT JOIN request r ON r.id = sv.request_id
      WHERE  
        sv.request_id = $1 
        AND sa.score_key = $2
        AND r.helicone_org_id = $3`,
      [requestId, scoreKey, this.authParams.organizationId],
    );

    return ok(rows.data?.[0]?.score ?? null);
  }
}
