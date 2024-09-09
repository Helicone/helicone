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
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { Result, err, ok } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { buildFilterPostgres } from "../../lib/shared/filters/filters";
import { resultMap } from "../../lib/shared/result";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";
import { Json } from "../../lib/db/database.types";
import { HeliconeDatasetManager } from "./HeliconeDatasetManager";

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
    const dataset = await supabaseServer.client
      .from("helicone_dataset")
      .insert({
        name: params.datasetName,
        organization: this.authParams.organizationId,
        meta: (params.meta ?? null) as Json,
        dataset_type: params.datasetType,
      })
      .select("*")
      .single();

    if (dataset.error) {
      return err(dataset.error.message);
    }

    const res = await dbExecute(
      `
      INSERT INTO experiment_dataset_v2_row (dataset_id, input_record)
      SELECT $1, id
      FROM prompt_input_record
      WHERE source_request = ANY($2)
      `,
      [dataset.data.id, params.requestIds]
    );

    if (res.error) {
      return err(res.error);
    }

    return ok(dataset.data.id);
  }

  async addRandomDataset(params: RandomDatasetParams): Promise<
    Result<
      {
        datasetId: string;
      },
      string
    >
  > {
    const dataset = await supabaseServer.client
      .from("helicone_dataset")
      .insert({
        name: params.datasetName,
        organization: this.authParams.organizationId,
      })
      .select("*")
      .single();

    if (dataset.error) {
      return err(dataset.error.message);
    }

    const filterWithAuth = buildFilterPostgres({
      filter: params.filter,
      argsAcc: [dataset.data.id],
    });

    const res = await dbExecute(
      `
      INSERT INTO experiment_dataset_v2_row (dataset_id, input_record)
      SELECT $1, prompt_input_record.id
      FROM prompt_input_record
      left join request on request.id = prompt_input_record.source_request
      left join prompts_versions on prompts_versions.id = prompt_input_record.prompt_version
      WHERE (${filterWithAuth.filter})
      ORDER BY random()
      `,
      filterWithAuth.argsAcc
    );

    if (res.error) {
      return err(res.error);
    }

    return ok({
      datasetId: dataset.data.id,
    });
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
      (SELECT created_at FROM prompt_input_record WHERE prompt_version = prompts_versions.id ORDER BY created_at DESC LIMIT 1) as last_used,
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
      ) as versions
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
