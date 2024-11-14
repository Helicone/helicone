import { ExperimentStore } from "../../lib/stores/experimentStore";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { BaseManager } from "../BaseManager";
import { err, ok, Result } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { InputsManager } from "../inputs/InputsManager";
import {
  ExperimentV2,
  ExperimentV2Output,
  ExperimentV2PromptVersion,
  ExperimentV2Row,
  ExtendedExperimentData,
} from "../../controllers/public/experimentV2Controller";
import { run } from "../../lib/experiment/run";

export class ExperimentV2Manager extends BaseManager {
  private ExperimentStore: ExperimentStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.ExperimentStore = new ExperimentStore(authParams.organizationId);
  }

  async hasAccessToExperiment(experimentId: string): Promise<boolean> {
    const experiment = await supabaseServer.client
      .from("experiment_v2") // TODO: I have no clue if this has to be changed
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

  async createNewExperiment(
    name: string,
    originalPromptVersion: string
  ): Promise<Result<{ experimentId: string }, string>> {
    try {
      const result = await supabaseServer.client
        .from("experiment_v3")
        .insert({
          name,
          original_prompt_version: originalPromptVersion,
          organization: this.authParams.organizationId,
        })
        .select();

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to create new experiment");
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

    // const promptVersions = await supabaseServer.client
    //   .from("prompts_versions")
    //   .select("*")
    //   .eq("experiment_id", experimentId)
    //   .eq("organization", this.authParams.organizationId);

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
          )
          FROM experiment_output eo 
          WHERE pir.id = eo.input_record_id
        ),
        '[]'::jsonb
      ) AS requests
    FROM prompt_input_record pir
    WHERE pir.experiment_id = $1
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
      console.log("oh okok");
      return err("Failed to get experiment");
    }
  }

  async getPromptVersionsForExperiment(
    experimentId: string
  ): Promise<Result<ExperimentV2PromptVersion[], string>> {
    const promptVersions = await supabaseServer.client
      .from("prompts_versions")
      .select("*")
      .eq("experiment_id", experimentId)
      .eq("organization", this.authParams.organizationId);
    return ok(promptVersions.data ?? []);
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
        experiment.original_prompt_version,
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
      const originalPIR = await supabaseServer.client
        .from("prompt_input_record")
        .select("*")
        .eq("id", inputRecordId)
        .single();

      if (!originalPIR.data) {
        return err("Original prompt input record not found");
      }

      const response = await supabaseServer.client
        .from("prompt_input_record")
        .insert({
          inputs,
          prompt_version: originalPIR.data.prompt_version,
          experiment_id: experimentId,
        })
        .select();

      if (response.error || !response.data || response.data.length === 0) {
        return err("Failed to create prompt input record");
      }

      await supabaseServer.client.from("experiment_output").insert({
        input_record_id: response.data[0].id,
        prompt_version_id: originalPIR.data.prompt_version,
        is_original: true,
        experiment_id: experimentId,
        request_id: originalPIR.data.source_request,
      });

      return ok(null);
    } catch (e) {
      return err("Failed to create experiment table row");
    }
  }

  async runHypothesis(
    experimentId: string,
    promptVersionId: string,
    inputRecordId: string
  ): Promise<Result<string, string>> {
    try {
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
}
