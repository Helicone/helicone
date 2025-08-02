import { SupabaseClient } from "@supabase/supabase-js";
import { Provider } from "../..";
import { Database, Json } from "../../../supabase/database.types";

export type ProviderKey = {
  provider: Provider;
  org_id: string;
  decrypted_provider_key: string;
  /*
   * If the provider is AWS Bedrock, we need to store the secret key along with the access key (which will be stored in the decrypted_provider_key)
   * In all other provider cases, this would be null
   */
  decrypted_provider_secret_key: string | null;
  /*
   * If the provider is AWS Bedrock, and the auth_type is "session_token", we store just the session token in the decrypted_provider_key and the decrypted_provider_secret_key is null
   * In all other provider cases, this would be "key"
   */
  auth_type: "key" | "session_token";
  config: Json | null;
};

const dbProviderToProvider = (provider: string): Provider | null => {
  if (provider === "openai" || provider === "OpenAI") {
    return "OPENAI";
  }
  if (provider === "Anthropic") {
    return "ANTHROPIC";
  }
  if (provider === "AWS Bedrock") {
    return "BEDROCK";
  }
  if (provider === "Groq") {
    return "GROQ";
  }
  if (provider === "Google AI (Gemini)") {
    return "GOOGLE";
  }
  if (provider === "Mistral AI") {
    return "MISTRAL";
  }
  if (provider === "Deepseek") {
    return "DEEPSEEK";
  }
  if (provider === "X.AI (Grok)") {
    return "X";
  }
  return null;
};

const providerToDbProvider = (provider: Provider): string => {
  if (provider === "OPENAI") {
    return "OpenAI";
  }
  if (provider === "ANTHROPIC") {
    return "Anthropic";
  }
  if (provider === "BEDROCK") {
    return "AWS Bedrock";
  }
  if (provider === "GROQ") {
    return "Groq";
  }
  if (provider === "GOOGLE") {
    return "Google AI (Gemini)";
  }
  if (provider === "MISTRAL") {
    return "Mistral AI";
  }
  if (provider === "DEEPSEEK") {
    return "Deepseek";
  }
  if (provider === "X") {
    return "X.AI (Grok)";
  }
  return provider;
};

export class ProviderKeysStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getProviderKeys(): Promise<ProviderKey[] | null> {
    const { data, error } = await this.supabaseClient
      .from("decrypted_provider_keys_v2")
      .select(
        "org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config"
      )
      .eq("soft_delete", false);

    if (error) {
      return null;
    }

    return data
      .map((row) => {
        const provider = dbProviderToProvider(row.provider_name ?? "");
        if (!provider) return null;

        return {
          org_id: row.org_id ?? "",
          provider,
          decrypted_provider_key: row.decrypted_provider_key ?? "",
          decrypted_provider_secret_key:
            row.decrypted_provider_secret_key ?? null,
          auth_type: row.auth_type as "key" | "session_token",
          config: row.config,
        };
      })
      .filter((key): key is ProviderKey => key !== null);
  }

  async getProviderKeyWithFetch(
    provider: Provider,
    orgId: string
  ): Promise<ProviderKey | null> {
    const { data, error } = await this.supabaseClient
      .from("decrypted_provider_keys_v2")
      .select(
        "org_id, decrypted_provider_key, decrypted_provider_secret_key, auth_type, provider_name, config"
      )
      .eq("provider_name", providerToDbProvider(provider))
      .eq("org_id", orgId)
      .eq("soft_delete", false);

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      provider: dbProviderToProvider(data[0].provider_name ?? "") ?? provider,
      org_id: orgId,
      decrypted_provider_key: data[0].decrypted_provider_key ?? "",
      decrypted_provider_secret_key:
        data[0].decrypted_provider_secret_key ?? null,
      auth_type: data[0].auth_type as "key" | "session_token",
      config: data[0].config,
    };
  }
}
