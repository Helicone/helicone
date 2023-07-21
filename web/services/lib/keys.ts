import { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../supabase/database.types";
import { Result } from "../../lib/result";

export type DecryptedProviderKey = {
  id: string | null;
  orgId: string | null;
  decryptedProviderKey: string | null;
  providerName: string | null;
  providerKeyName: string | null;
};

export type HeliconeProxyKeyMapping =
  Database["public"]["Tables"]["proxy_key_mappings"]["Row"];

export type DecryptedProviderKeyMapping = DecryptedProviderKey & HeliconeProxyKeyMapping;

export type AddKeyObj = {
  userId: string;
  apiKeyHash: string;
  apiKeyPreview: string;
  keyName: string;
};

const addKey = async (client: SupabaseClient<Database>, key: AddKeyObj) => {
  const { data, error } = await client.from("user_api_keys").insert([
    {
      user_id: key.userId,
      api_key_hash: key.apiKeyHash,
      api_key_preview: key.apiKeyPreview,
      key_name: key.keyName,
    },
  ]);

  return { data, error };
};

async function getDecryptedProviderKeysByOrgId(
  client: SupabaseClient<Database>,
  orgId: string
): Promise<Result<DecryptedProviderKey[], string>> {
  const keys = await client
    .from("decrypted_provider_keys")
    .select(
      "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
    )
    .eq("org_id", orgId);

  if (keys.error !== null || keys.data === null) {
    console.log("Failed to retrieve proxy keys");
    return { data: null, error: keys.error.message };
  }

  const providerKeys: DecryptedProviderKey[] = keys.data.map((key) => ({
    id: key.id,
    orgId: key.org_id,
    decryptedProviderKey: key.decrypted_provider_key,
    providerName: key.provider_name,
    providerKeyName: key.provider_key_name,
  }));

  return { data: providerKeys, error: null };
}

async function getDecryptedProviderKeyById(
  client: SupabaseClient<Database>,
  providerKeyId: string
): Promise<Result<DecryptedProviderKey, string>> {
  const key = await client
    .from("decrypted_provider_keys")
    .select(
      "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
    )
    .eq("id", providerKeyId)
    .single();

  if (key.error !== null || key.data === null) {
    console.log("Failed to retrieve proxy key");
    return { data: null, error: key.error.message };
  }

  const providerKey: DecryptedProviderKey = {
    id: key.data.id,
    orgId: key.data.org_id,
    decryptedProviderKey: key.data.decrypted_provider_key,
    providerName: key.data.provider_name,
    providerKeyName: key.data.provider_key_name,
  };

  return { data: providerKey, error: null };
}

export { addKey, getDecryptedProviderKeysByOrgId, getDecryptedProviderKeyById };
