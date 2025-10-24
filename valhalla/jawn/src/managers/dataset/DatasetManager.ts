// src/users/usersService.ts
import {
  DatasetMetadata,
  DatasetResult,
  NewDatasetParams,
  RandomDatasetParams,
} from "../../controllers/public/experimentDatasetController";
import {
  PromptQueryParams,
  PromptResult,
  PromptVersionResult,
  PromptsQueryParams,
  PromptsResult,
} from "../../controllers/public/promptController";
import { AuthParams } from "../../packages/common/auth/types";
import { Result, err, ok } from "../../packages/common/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { buildFilterPostgres } from "@helicone-package/filters/filters";
import { resultMap } from "../../packages/common/result";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";
import { Database, Json } from "../../lib/db/database.types";
import { HeliconeDatasetManager } from "./HeliconeDatasetManager";
import { randomUUID } from "crypto";

// A post request should not contain an id.
export type UserCreationParams = Pick<User, "email" | "name" | "phoneNumbers">;

export class DatasetManager extends BaseManager {
  readonly helicone: HeliconeDatasetManager;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.helicone = new HeliconeDatasetManager(authParams);
  }

  async getDatasets(
    promptVersionId?: string
  ): Promise<Result<DatasetResult[], string>> {
    const result = dbExecute<{
      id: string;
      name: string;
      created_at: string;
      meta: DatasetMetadata;
    }>(
      `
    SELECT
      id,
      name,
      created_at,
      meta
    FROM helicone_dataset
    WHERE organization = $1 ${
      promptVersionId ? "AND meta->>'promptVersionId' = $2" : ""
    }
    LIMIT 100
    `,
      [this.authParams.organizationId].concat(
        promptVersionId ? [promptVersionId] : []
      )
    );
    return result;
  }

  async addDataset(params: NewDatasetParams): Promise<Result<string, string>> {
    // DEPRECATED: This function used the deleted prompt_input_record table.
    // The legacy prompt system has been replaced by prompts_2025_inputs.
    // Use HeliconeDatasetManager for new dataset operations.
    return err("addDataset is deprecated - prompt_input_record table has been removed. Use the new prompt system instead.");
  }

  async addDatasetRow(
    datasetId: string,
    inputRecordId: string
  ): Promise<Result<string, string>> {
    try {
      // First verify the dataset exists and belongs to this organization
      const existingDataset = await dbExecute<{ id: string }>(
        `SELECT id
         FROM helicone_dataset
         WHERE organization = $1
         AND id = $2
         LIMIT 1`,
        [this.authParams.organizationId, datasetId]
      );

      if (
        existingDataset.error ||
        !existingDataset.data ||
        existingDataset.data.length === 0
      ) {
        return err("Dataset not found");
      }

      const dataset = await dbExecute<{ id: string }>(
        `INSERT INTO experiment_dataset_v2_row (dataset_id, input_record)
         VALUES ($1, $2)
         RETURNING id`,
        [datasetId, inputRecordId]
      );

      if (dataset.error || !dataset.data || dataset.data.length === 0) {
        return err(dataset.error ?? "Failed to add dataset row");
      }

      return ok(dataset.data[0].id);
    } catch (error) {
      console.error("Error adding dataset row:", error);
      return err(String(error));
    }
  }

  async addRandomDataset(params: RandomDatasetParams): Promise<
    Result<
      {
        datasetId: string;
      },
      string
    >
  > {
    // DEPRECATED: This function used the deleted prompt_input_record and request tables.
    // The legacy prompt system has been replaced by prompts_2025_inputs.
    // Use HeliconeDatasetManager for new dataset operations.
    return err("addRandomDataset is deprecated - prompt_input_record table has been removed. Use the new prompt system instead.");
  }

  async getPromptVersions(
    filter: FilterNode
  ): Promise<Result<PromptVersionResult[], string>> {
    const filterWithAuth = buildFilterPostgres({
      filter,
      argsAcc: [this.authParams.organizationId],
    });

    const result = dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      created_at: string;
      metadata: Record<string, any>;
    }>(
      `
    SELECT
      prompts_versions.id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      created_at,
      metadata
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND (${filterWithAuth.filter})
    `,
      filterWithAuth.argsAcc
    );

    return result;
  }

  async getPrompts(
    params: PromptsQueryParams
  ): Promise<Result<PromptsResult[], string>> {
    const filterWithAuth = buildFilterPostgres({
      filter: params.filter,
      argsAcc: [this.authParams.organizationId],
    });

    filterWithAuth.argsAcc;
    const result = dbExecute<{
      id: string;
      user_defined_id: string;
      description: string;
      pretty_name: string;
      created_at: string;
      major_version: number;
    }>(
      `
    SELECT
      id,
      user_defined_id,
      description,
      pretty_name,
      created_at,
      (SELECT major_version FROM prompts_versions pv WHERE pv.prompt_v2 = prompt_v2.id ORDER BY major_version DESC LIMIT 1) as major_version
    FROM prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND (${filterWithAuth.filter})
    `,
      filterWithAuth.argsAcc
    );
    return result;
  }

  async getPrompt(
    params: PromptQueryParams,
    promptId: string
  ): Promise<Result<PromptResult, string>> {
    const result = await dbExecute<{
      id: string;
      user_defined_id: string;
      description: string;
      pretty_name: string;
      major_version: number;
      latest_version_id: string;
      latest_model_used: string;
      created_at: string;
      last_used: string;
      versions: string[];
      metadata: Record<string, any>;
    }>(
      `
    SELECT
      prompt_v2.id,
      prompt_v2.user_defined_id,
      prompt_v2.description,
      prompt_v2.pretty_name,
      prompts_versions.major_version,
      prompts_versions.id as latest_version_id,
      prompts_versions.model as latest_model_used,
      prompt_v2.created_at as created_at,
      (SELECT created_at FROM prompts_2025_inputs WHERE version_id = prompts_versions.id ORDER BY created_at DESC LIMIT 1) as last_used,
      (
        SELECT array_agg(pv2.versions) as versions
        FROM
        (
          SELECT prompts_versions.id as versions
          from prompts_versions
          WHERE prompts_versions.prompt_v2 = prompt_v2.id
          ORDER BY prompts_versions.major_version DESC, prompts_versions.minor_version DESC
          LIMIT 100
        ) as pv2
      ) as versions,
      prompt_v2.metadata
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND prompt_v2.id = $2
    ORDER BY prompts_versions.major_version DESC, prompts_versions.minor_version DESC
    `,
      [this.authParams.organizationId, promptId]
    );

    return resultMap(result, (data) => data[0]);
  }

  async getPromptVersion(params: {
    promptVersionId: string;
  }): Promise<Result<PromptVersionResult[], string>> {
    const result = dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      created_at: string;
      metadata: Record<string, any>;
    }>(
      `
    SELECT
      id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      created_at,
      metadata
    FROM prompts_versions
    WHERE prompts_versions.organization = $1
    AND prompts_versions.id = $2
    `,
      [this.authParams.organizationId, params.promptVersionId]
    );
    return result;
  }
}
