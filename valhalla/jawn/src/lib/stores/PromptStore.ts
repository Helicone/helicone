import { SupabaseClient } from "@supabase/supabase-js";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { Database } from "../db/database.types";

export class PromptStore {
  private supabaseClient: SupabaseClient<Database>;
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabaseClient = supabaseClient;
  }

  async getPromptById(
    orgId: string,
    promptId: string
  ): PromiseGenericResult<
    Database["public"]["Tables"]["prompt_v2"]["Row"] | null
  > {
    const res = await this.supabaseClient
      .from("prompt_v2")
      .select("*")
      .eq("organization", orgId)
      .eq("user_defined_id", promptId)
      .limit(1);

    if (res.error) {
      return err(res.error.message);
    }

    if (res.data.length === 0) {
      return ok(null);
    }

    return ok(res.data[0]);
  }

  async getPromptVersionByPromptId(
    orgId: string,
    promptId: string
  ): PromiseGenericResult<
    Database["public"]["Tables"]["prompts_versions"]["Row"] | null
  > {
    const res = await this.supabaseClient
      .from("prompts_versions")
      .select("*")
      .eq("organization", orgId)
      .eq("prompt_v2", promptId)
      .order("major_version", { ascending: false })
      .limit(1);

    if (res.error) {
      return err(res.error.message);
    }

    if (res.data.length === 0) {
      return ok(null);
    }

    return ok(res.data[0]);
  }
}
