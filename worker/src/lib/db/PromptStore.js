import { err, ok } from "../util/results";
export class PromptStore {
    supabaseClient;
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
    }
    async getPromptVersionId(params, orgId) {
        const { prompt_id, version_id, environment } = params;
        if (environment) {
            const envVersionId = await this.getEnvironmentVersionId(prompt_id, environment, orgId);
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
        const productionVersionId = await this.getProductionVersionId(prompt_id, orgId);
        if (!productionVersionId) {
            return err("Invalid prompt ID - no valid version found");
        }
        return ok(productionVersionId);
    }
    async getEnvironmentVersionId(promptId, environment, orgId) {
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
    async getVersionById(versionId, orgId) {
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
    async getProductionVersionId(promptId, orgId) {
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
