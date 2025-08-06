import pgPromise from "pg-promise";
import { Provider } from "../..";
import { Json } from "../../../supabase/database.types";

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
  constructor(private sql: pgPromise.IDatabase<any>) {}

  async getProviderKeys(): Promise<ProviderKey[] | null> {
    try {
      const data = await this.sql.query<{
        org_id: string | null;
        decrypted_provider_key: string | null;
        decrypted_provider_secret_key: string | null;
        auth_type: string;
        provider_name: string | null;
        config: Json;
      }>(
        `SELECT org_id, decrypted_provider_key, decrypted_provider_secret_key, 
                auth_type, provider_name, config
         FROM decrypted_provider_keys_v2
         WHERE soft_delete = false
           AND decrypted_provider_key IS NOT NULL`
      );

      return data
        .map((row: any) => {
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
        .filter((key: any): key is ProviderKey => key !== null);
    } catch (error) {
      console.error("error getting provider keys", error);
      return null;
    }
  }

  async getProviderKeyWithFetch(
    provider: Provider,
    orgId: string
  ): Promise<ProviderKey | null> {
    try {
      const data = await this.sql.query<{
        org_id: string | null;
        decrypted_provider_key: string | null;
        decrypted_provider_secret_key: string | null;
        auth_type: string;
        provider_name: string | null;
        config: Json;
      }>(
        `SELECT org_id, decrypted_provider_key, decrypted_provider_secret_key, 
                auth_type, provider_name, config
         FROM decrypted_provider_keys_v2
         WHERE provider_name = $1
           AND org_id = $2
           AND soft_delete = false
         LIMIT 1`,
        [providerToDbProvider(provider), orgId]
      );

      if (!data || data.length === 0) {
        return null;
      }

      const firstRow = data[0];
      return {
        provider: dbProviderToProvider(firstRow.provider_name ?? "") ?? provider,
        org_id: orgId,
        decrypted_provider_key: firstRow.decrypted_provider_key ?? "",
        decrypted_provider_secret_key:
          firstRow.decrypted_provider_secret_key ?? null,
        auth_type: firstRow.auth_type as "key" | "session_token",
        config: firstRow.config,
      };
    } catch (error) {
      console.error("Error fetching provider key:", error);
      return null;
    }
  }
}
