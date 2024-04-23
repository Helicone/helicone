// src/users/usersService.ts
import {
  PromptCreateSubversionParams,
  PromptInputRecord,
  PromptQueryParams,
  PromptResult,
  PromptVersionResult,
  PromptsQueryParams,
  PromptsResult,
} from "../../controllers/public/promptController";
import { Result, err } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { buildFilterPostgres } from "../../lib/shared/filters/filters";
import { resultMap } from "../../lib/shared/result";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";

export class InputsManager extends BaseManager {
  async getInputs(
    limit: number,
    promptVersion: string,
    random: boolean
  ): Promise<Result<PromptInputRecord[], string>> {
    return await dbExecute<PromptInputRecord>(
      `
      SELECT 
        prompt_input_record.id as id,
        prompt_input_record.inputs as inputs,
        prompt_input_record.source_request as source_request,
        prompt_input_record.prompt_version as prompt_version,
        prompt_input_record.created_at as created_at
      FROM prompt_input_record
      left join request on prompt_input_record.source_request = request.id
      WHERE  request.helicone_org_id = $1 AND
      prompt_input_record.prompt_version = $2
      ${
        random
          ? "ORDER BY random()"
          : "ORDER BY prompt_input_record.created_at DESC"
      }
      LIMIT $3

      `,
      [this.authParams.organizationId, promptVersion, limit]
    );
  }
}
