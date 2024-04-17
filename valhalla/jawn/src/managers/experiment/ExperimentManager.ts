// src/users/usersService.ts
import { NewExperimentParams } from "../../controllers/public/experimentController";
import { supabaseServer } from "../../lib/db/supabase";
import { Result, err, ok } from "../../lib/modules/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { BaseManager } from "../BaseManager";

export class ExperimentManager extends BaseManager {
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
