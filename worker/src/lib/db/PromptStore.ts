import { HeliconeChatCreateParams } from "@helicone-package/prompts/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { err, ok, Result } from "../util/results";

export class PromptStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getPromptVersionId(
    params: HeliconeChatCreateParams,
    orgId: string
  ): Promise<Result<string, string>> {
    const { prompt_id, version_id, environment } = params;
    if (environment) {
      const versionId = await this.getEnvironmentVersionId(prompt_id, environment, orgId);
      if (!versionId) return err("Invalid prompt environment");
      return ok(versionId);
    }
    if (version_id) {
      const versionId = await this.getVersionById(version_id, orgId);
      if (!versionId) return err("Invalid prompt version");
      return ok(versionId);
    }
    const versionId = await this.getProductionVersionId(prompt_id, orgId);
    if (!versionId) return err("Invalid prompt ID");
    return ok(versionId);
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