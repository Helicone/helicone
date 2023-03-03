import { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import { DEMO_EMAIL } from "../../lib/constants";

const getKeys = async (client: SupabaseClient<any, "public", any>) => {
  const { data, error, count } = await client
    .from("user_api_keys")
    .select("*", { count: "exact" });

  return { data, error, count };
};

const deleteKey = async (
  client: SupabaseClient<any, "public", any>,
  apiKeyHash: string
) => {
  const { data, error } = await client
    .from("user_api_keys")
    .delete()
    .eq("api_key_hash", apiKeyHash);

  return { data, error };
};

export type AddKeyObj = {
  userId: string;
  apiKeyHash: string;
  apiKeyPreview: string;
  keyName: string;
};

const addKey = async (
  client: SupabaseClient<any, "public", any>,
  key: AddKeyObj
) => {
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

export { getKeys, deleteKey, addKey };
