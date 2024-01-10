import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../supabase/database.types";
import { Result } from "../../lib/shared/result";

export type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
};

export type HeliconeProxyKeys =
  Database["public"]["Tables"]["helicone_proxy_keys"]["Row"];

export type DecryptedProviderKeyMapping = DecryptedProviderKey &
  HeliconeProxyKeys & {
    limits: Database["public"]["Tables"]["helicone_proxy_key_limits"]["Row"][];
  };

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
    .eq("org_id", orgId)
    .eq("soft_delete", false);

  if (keys.error !== null || keys.data === null) {
    return { data: null, error: keys.error.message };
  }

  const providerKeys: DecryptedProviderKey[] = keys.data.map((key) => ({
    id: key.id,
    org_id: key.org_id,
    provider_key: key.decrypted_provider_key,
    provider_name: key.provider_name,
    provider_key_name: key.provider_key_name,
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
    .eq("soft_delete", false)
    .single();

  if (key.error !== null || key.data === null) {
    return { data: null, error: key.error.message };
  }

  const providerKey: DecryptedProviderKey = {
    id: key.data.id,
    org_id: key.data.org_id,
    provider_key: key.data.decrypted_provider_key,
    provider_name: key.data.provider_name,
    provider_key_name: key.data.provider_key_name,
  };

  return { data: providerKey, error: null };
}

export { addKey, getDecryptedProviderKeysByOrgId, getDecryptedProviderKeyById };
