import { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../supabase/database.types";
import { Result } from "../../lib/result";

export type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
  vault_key_id?: string | null;
};

export type HeliconeProxyKeys =
  Database["public"]["Tables"]["helicone_proxy_keys"]["Row"];

export type DecryptedProviderKeyMapping = DecryptedProviderKey &
  HeliconeProxyKeys;

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

export { addKey };
