import { ExperimentStore } from "../../lib/stores/experimentStore";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { BaseManager } from "../BaseManager";
import { err, ok, Result } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { InputsManager } from "../inputs/InputsManager";
import {
  CreateNewPromptVersionForExperimentParams,
  ExperimentV2,
  ExperimentV2PromptVersion,
  ExperimentV2Row,
  ExtendedExperimentData,
} from "../../controllers/public/experimentV2Controller";
import { run } from "../../lib/experiment/run";
import { PromptManager } from "../prompt/PromptManager";
import { PromptVersionResult } from "../../controllers/public/promptController";

export interface ScoreV2 {
  valueType: string;
  value: number | Date | string;
  max: number;
  min: number;
}

export interface ExperimentOutputForScores {
  request_id: string;
  input_record: {
    id: string;
    inputs: Record<string, string>;
    autoInputs: Record<string, string>;
  };
  scores: Record<string, ScoreV2>;
}

function getCustomScores(
  scores: Record<string, ScoreV2>[]
): Record<string, ScoreV2> {
  const scoresValues = scores.reduce((acc, record) => {
    for (const key in record) {
      if (record.hasOwnProperty(key) && typeof record[key].value === "number") {
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
  }, {} as Record<string, { sum: number; count: number; valueType: string; max: number; min: number }>);

  return Object.fromEntries(
    Object.entries(scoresValues).map(
      ([key, { sum, count, valueType, max, min }]) => [
        key,
        { value: sum / count, valueType, max, min },
      ]
    )
  );
}

export class ExperimentV2Manager extends BaseManager {
  private ExperimentStore: ExperimentStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.ExperimentStore = new ExperimentStore(authParams.organizationId);
  }

  async hasAccessToExperiment(experimentId: string): Promise<boolean> {
    const experiment = await supabaseServer.client
      .from("experiment_v3") // TODO: I have no clue if this has to be changed
      .select("*")
      .eq("id", experimentId)
      .eq("organization", this.authParams.organizationId)
      .single();
    return !!experiment.data;
  }

  async getExperiments(): Promise<Result<ExperimentV2[], string>> {
    try {
      const response = await supabaseServer.client
        .from("experiment_v3")
        .select("*")
        .eq("organization", this.authParams.organizationId);

      return ok(response.data ?? []);
    } catch (e) {
      return err("Failed to get experiments");
    }
  }

  async getExperimentById(experimentId: string): Promise<ExperimentV2 | null> {
    const experiment = await supabaseServer.client
      .from("experiment_v3")
      .select("*")
      .eq("id", experimentId)
      .eq("organization", this.authParams.organizationId)
      .single();
    return experiment.data ?? null;
  }

  // this query needs to be better imo
  async createNewExperiment(
    name: string,
    originalPromptVersion: string
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

      const inputKeys = await supabaseServer.client
        .from("prompt_input_keys")
        .select("key")
        .eq("prompt_version", originalPromptVersion);

      const result = await supabaseServer.client
        .from("experiment_v3")
        .insert({
          name,
          original_prompt_version: originalPromptVersion,
          organization: this.authParams.organizationId,
          input_keys: inputKeys.data?.map((key) => key.key) ?? [],
        })
        .select();

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to create new experiment");
      }

      const newPromptVersion = await promptManager.createNewPromptVersion(
        originalPromptVersion,
        {
          newHeliconeTemplate: originalPromptVersionData.helicone_template,
          experimentId: result.data[0].id,
          metadata: {
            label: "Original",
          },
        }
      );

      if (newPromptVersion.error || !newPromptVersion.data) {
        return err("Failed to create new prompt version");
      }

      const updatedExperiment = await supabaseServer.client
        .from("experiment_v3")
        .update({
          copied_original_prompt_version: newPromptVersion.data.id,
        })
        .eq("id", result.data[0].id);

      if (updatedExperiment.error) {
        return err("Failed to update experiment");
      }

      return ok({ experimentId: result.data[0].id });
    } catch (e) {
      return err("Failed to create new experiment");
    }
  }

  async getExperimentWithRowsById(
    experimentId: string
  ): Promise<Result<ExtendedExperimentData, string>> {
    const experiment = await supabaseServer.client
      .from("experiment_v3")
      .select("*")
      .eq("id", experimentId)
      .eq("organization", this.authParams.organizationId)
      .single();

    try {
      const rows = await dbExecute<ExperimentV2Row>(
        `
    SELECT 
      pir.id,
      pir.inputs,
      pir.prompt_version,
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
    ORDER BY pir.created_at DESC
        `,
        [experimentId]
      );

      if (rows.error || !rows.data) {
        return err("Failed to get experiment");
      }

      if (!experiment.data || !experiment.data.id) {
        return err("Experiment data is incomplete");
      }

      return ok({
        ...experiment.data,
        rows: rows.data,
        // prompt_versions: promptVersions.data ?? [],
      });
    } catch (e) {
      return err("Failed to get experiment");
    }
  }

  async getExperimentOutputForScores(
    experimentId: string
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
        [experimentId]
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
    requestBody: CreateNewPromptVersionForExperimentParams
  ): Promise<Result<PromptVersionResult, string>> {
    try {
      const promptManager = new PromptManager(this.authParams);
      const result = await promptManager.createNewPromptVersion(
        requestBody.parentPromptVersionId,
        requestBody
      );

      if (result.error || !result.data) {
        return err("Failed to create new prompt version");
      }

      const newPromptVersionInputKeys = Array.from(
        JSON.stringify(result.data.helicone_template).matchAll(
          /<helicone-prompt-input key=\\"(\w+)\\" \/>/g
        )
      ).map((match) => match[1]);

      const existingExperimentInputKeys = await supabaseServer.client
        .from("experiment_v3")
        .select("input_keys")
        .eq("id", experimentId)
        .single();

      const res = await Promise.all([
        supabaseServer.client
          .from("experiment_v3")
          .update({
            input_keys: [
              ...new Set([
                ...(existingExperimentInputKeys.data?.input_keys ?? []),
                ...newPromptVersionInputKeys,
              ]),
            ],
          })
          .eq("organization", this.authParams.organizationId)
          .eq("id", experimentId),
        dbExecute(
          `INSERT INTO prompt_input_keys (key, prompt_version)
       SELECT unnest($1::text[]), $2
       ON CONFLICT (key, prompt_version) DO NOTHING`,
          [`{${newPromptVersionInputKeys.join(",")}}`, result.data.id]
        ),
      ]);

      if (res.some((r) => r.error)) {
        return err("Failed to create new prompt version for experiment");
      }

      return ok(result.data);
    } catch (e) {
      return err("Failed to create new prompt version for experiment");
    }
  }

  async getPromptVersionsForExperiment(
    experimentId: string
  ): Promise<Result<ExperimentV2PromptVersion[], string>> {
    const promptVersions = await supabaseServer.client
      .from("prompts_versions")
      .select("*")
      .eq("experiment_id", experimentId)
      .eq("organization", this.authParams.organizationId)
      .order("minor_version", { ascending: true });
    return ok(promptVersions.data ?? []);
  }

  async getInputKeysForExperiment(
    experimentId: string
  ): Promise<Result<string[], string>> {
    const inputKeys = await supabaseServer.client
      .from("experiment_v3")
      .select("input_keys")
      .eq("id", experimentId)
      .eq("organization", this.authParams.organizationId)
      .single();
    return ok(inputKeys.data?.input_keys ?? []);
  }

  async addManualRowToExperiment(
    experimentId: string,
    inputs: Record<string, string>
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
        experimentId
      );
      if (result.error || !result.data) {
        return err("Failed to add manual row to experiment");
      }
      return ok(result.data);
    } catch (e) {
      return err("Failed to add manual row to experiment");
    }
  }

  async createExperimentTableRowBatch(
    experimentId: string,
    rows: { inputRecordId: string; inputs: Record<string, string> }[]
  ): Promise<Result<null, string>> {
    try {
      await Promise.all(
        rows.map(async (row) => {
          await this.createExperimentTableRow(
            experimentId,
            row.inputRecordId,
            row.inputs
          );
        })
      );

      return ok(null);
    } catch (e) {
      return err("Failed to create experiment table row with cells batch");
    }
  }

  async createExperimentTableRow(
    experimentId: string,
    inputRecordId: string,
    inputs: Record<string, string>
  ): Promise<Result<null, string>> {
    try {
      const [originalPIR, experiment] = await Promise.all([
        supabaseServer.client
          .from("prompt_input_record")
          .select("*")
          .eq("id", inputRecordId)
          .single(),
        this.getExperimentById(experimentId),
      ]);

      if (!originalPIR.data) {
        return err("Original prompt input record not found");
      }

      if (!experiment) {
        return err("Experiment not found");
      }

      const response = await supabaseServer.client
        .from("prompt_input_record")
        .insert({
          inputs,
          prompt_version: experiment?.copied_original_prompt_version ?? "",
          experiment_id: experimentId,
        })
        .select();

      if (response.error || !response.data || response.data.length === 0) {
        return err("Failed to create prompt input record");
      }

      await supabaseServer.client.from("experiment_output").insert({
        input_record_id: response.data[0].id,
        prompt_version_id: experiment?.copied_original_prompt_version ?? "",
        is_original: true,
        experiment_id: experimentId,
        request_id: originalPIR.data.source_request,
      });

      return ok(null);
    } catch (e) {
      return err("Failed to create experiment table row");
    }
  }

  async updateExperimentTableRow(
    experimentId: string,
    inputRecordId: string,
    inputs: Record<string, string>
  ): Promise<Result<null, string>> {
    try {
      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        return err("Experiment not found");
      }
      const result = await supabaseServer.client
        .from("prompt_input_record")
        .update({ inputs })
        .eq("id", inputRecordId)
        .eq("experiment_id", experimentId);

      if (result.error) {
        return err("Failed to update experiment table row");
      }

      return ok(null);
    } catch (e) {
      return err("Failed to update experiment table row");
    }
  }

  async runHypothesis(
    experimentId: string,
    promptVersionId: string,
    inputRecordId: string
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
        this.authParams.organizationId
      );

      return result;
    } catch (e) {
      return err("Failed to run hypothesis");
    }
  }

  async getExperimentPromptVersionScores(
    experimentId: string,
    promptVersionId: string
  ): Promise<Result<Record<string, ScoreV2>, string>> {
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
      [experimentId, promptVersionId]
    );

    const scoresArray = rows.data?.map((row) => row.scores) ?? [];

    const scores = getCustomScores(scoresArray);

    return ok(scores);
  }

  async getExperimentRequestScore(
    experimentId: string,
    requestId: string,
    scoreKey: string
  ): Promise<Result<ScoreV2 | null, string>> {
    const rows = await dbExecute<{ score: ScoreV2 }>(
      `SELECT jsonb_build_object(
          'value', sv.int_value,
          'valueType', sa.value_type
        ) as score
      FROM score_value sv
      JOIN score_attribute sa ON sa.id = sv.score_attribute
      WHERE sv.request_id = $1 AND sa.score_key = $2`,
      [requestId, scoreKey]
    );

    return ok(rows.data?.[0]?.score ?? null);
  }
}
