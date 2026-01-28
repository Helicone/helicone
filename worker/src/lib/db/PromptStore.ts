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
      .contains("environments", [environment])
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

  /**
   * Gets the model from a prompt version based on the prompt params.
   * Uses the same resolution logic as getPromptVersionId:
   * 1. If environment is specified, use the version for that environment
   * 2. If version_id is specified, use that specific version
   * 3. Otherwise, use the production version
   */
  async getModelFromPrompt(
    params: HeliconePromptParams,
    orgId: string
  ): Promise<Result<string, string>> {
    const { prompt_id, version_id, environment } = params;

    if (!prompt_id) {
      return err("No prompt ID provided");
    }

    // If environment is specified, get model from environment version
    if (environment) {
      const model = await this.getModelFromEnvironmentVersion(
        prompt_id,
        environment,
        orgId
      );
      if (model) {
        return ok(model);
      }
    }

    // If specific version_id is provided, get model from that version
    if (version_id) {
      const model = await this.getModelFromVersionById(version_id, orgId);
      if (model) {
        return ok(model);
      }
    }

    // Fall back to production version
    const model = await this.getModelFromProductionVersion(prompt_id, orgId);
    if (!model) {
      return err("Invalid prompt ID - no valid version found");
    }
    return ok(model);
  }

  private async getModelFromEnvironmentVersion(
    promptId: string,
    environment: string,
    orgId: string
  ): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from("prompts_2025_versions")
      .select("model")
      .eq("prompt_id", promptId)
      .contains("environments", [environment])
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (error || !data) {
      return null;
    }

    return data.model;
  }

  private async getModelFromVersionById(
    versionId: string,
    orgId: string
  ): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from("prompts_2025_versions")
      .select("model")
      .eq("id", versionId)
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (error || !data) {
      return null;
    }

    return data.model;
  }

  private async getModelFromProductionVersion(
    promptId: string,
    orgId: string
  ): Promise<string | null> {
    // First, get the production version ID from prompts_2025
    const { data: promptData, error: promptError } = await this.supabaseClient
      .from("prompts_2025")
      .select("production_version")
      .eq("id", promptId)
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (promptError || !promptData || !promptData.production_version) {
      return null;
    }

    // Then get the model from the version
    const { data: versionData, error: versionError } = await this.supabaseClient
      .from("prompts_2025_versions")
      .select("model")
      .eq("id", promptData.production_version)
      .eq("organization", orgId)
      .eq("soft_delete", false)
      .single();

    if (versionError || !versionData) {
      return null;
    }

    return versionData.model;
  }
}
