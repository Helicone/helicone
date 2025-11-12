import { HeliconePromptParams } from "@helicone-package/prompts/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { err, ok, Result } from "../util/results";

export class PromptStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getPromptVersionId(
    params: HeliconePromptParams,
    orgId: string
  ): Promise<Result<string, string>> {
    const { prompt_id, version_id, environment } = params;

    if (!prompt_id) {
      return err("No prompt ID provided");
    }

    if (environment) {
      const envVersionId = await this.getEnvironmentVersionId(
        prompt_id,
        environment,
        orgId
      );
      if (envVersionId) {
        return ok(envVersionId);
      }
    }

    if (version_id) {
      const specificVersionId = await this.getVersionById(version_id, orgId);
      if (specificVersionId) {
        return ok(specificVersionId);
      }
    }

    const productionVersionId = await this.getProductionVersionId(
      prompt_id,
      orgId
    );
    if (!productionVersionId) {
      return err("Invalid prompt ID - no valid version found");
    }
    return ok(productionVersionId);
  }

  private async getEnvironmentVersionId(
    promptId: string,
    environment: string,
    orgId: string
  ): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from("prompts_2025_versions")
      .select("id")
      .eq("prompt_id", promptId)
      .eq("environment", environment)
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  }

  private async getVersionById(
    versionId: string,
    orgId: string
  ): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from("prompts_2025_versions")
      .select("id")
      .eq("id", versionId)
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  }

  private async getProductionVersionId(
    promptId: string,
    orgId: string
  ): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from("prompts_2025")
      .select("production_version")
      .eq("id", promptId)
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (error || !data || !data.production_version) {
      return null;
    }

    return data.production_version;
  }
}
