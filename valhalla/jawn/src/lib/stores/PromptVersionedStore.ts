import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { BaseStore } from "./baseStore";
import { dbExecute } from "../shared/db/dbExecute";
import { FilterLeafSubset } from "../shared/filters/filterDefs";
import { buildFilterPostgres } from "../shared/filters/filters";

export type PromptVersionedFilterBranch = {
  left: PromptVersionedFilterNode;
  operator: "or" | "and";
  right: PromptVersionedFilterNode;
};
export type PromptVersionedFilterNode =
  | FilterLeafSubset<"prompts_versions">
  | PromptVersionedFilterBranch
  | "all";

export class PromptVersionedStore extends BaseStore {
  async getPromptVersion(filter: PromptVersionedFilterNode) {
    const builtFilter = buildFilterPostgres({
      filter,
      argsAcc: [this.organizationId],
    });
    return dbExecute<{
      major_version: number;
      minor_version: number;
      helicone_template: string;
      prompt_v2: {
        id: string;
        user_defined_id: string;
        organization: string;
      };
      model: string;
      organization: string;
    }>(
      `
    SELECT 
      prompts_versions.major_version,
      prompts_versions.minor_version,
      prompts_versions.helicone_template,
      jsonb_build_object(
        'id', prompt_v2.id,
        'user_defined_id', prompt_v2.user_defined_id,
        'organization', prompt_v2.organization
      ) as prompt_v2,
      prompts_versions.model,
      prompts_versions.organization
    FROM prompts_versions
    left join prompt_v2 on prompts_versions.prompt_v2 = prompt_v2.id
    WHERE prompts_versions.organization = $1
    AND (${builtFilter.filter})
    `,
      builtFilter.argsAcc
    );
  }
}
