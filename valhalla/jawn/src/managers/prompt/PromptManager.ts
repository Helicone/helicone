// src/users/usersService.ts
import {
  PromptQueryParams,
  PromptResult,
  PromptVersionResult,
  PromptsQueryParams,
  PromptsResult,
} from "../../controllers/public/promptController";
import { Result } from "../../lib/modules/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { resultMap } from "../../lib/shared/result";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";

// A post request should not contain an id.
export type UserCreationParams = Pick<User, "email" | "name" | "phoneNumbers">;

export class PromptManager extends BaseManager {
  async getPrompts(
    params: PromptsQueryParams
  ): Promise<Result<PromptsResult[], string>> {
    const result = dbExecute<{
      id: string;
      user_defined_id: string;
      description: string;
      pretty_name: string;
      major_version: number;
    }>(
      `
    SELECT 
      id,
      user_defined_id,
      description,
      pretty_name,
      (SELECT major_version FROM prompts_versions pv WHERE pv.prompt_v2 = prompt_v2.id ORDER BY major_version DESC LIMIT 1) as major_version
    FROM prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    `,
      [this.authParams.organizationId]
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
    }>(
      `
    SELECT 
      id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model
    FROM prompts_versions
    WHERE prompts_versions.organization = $1
    AND prompts_versions.id = $2
    `,
      [this.authParams.organizationId, params.promptVersionId]
    );
    return result;
  }
}
