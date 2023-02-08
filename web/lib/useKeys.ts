import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { getKeys } from "../services/lib/keys";
import { Database } from "../supabase/database.types";

export function useKeys(supabaseClient: SupabaseClient) {
  const client = useSupabaseClient();
  const [apiKeys, setApiKeys] =
    useState<Database["public"]["Tables"]["user_api_keys"]["Row"][]>();

  const refreshKeys = useCallback(async () => {
    const { data, error } = await getKeys(client);
    if (error) {
      console.log(error);
    } else {
      const keys = data;
      keys?.forEach((key) => {
        if (key.key_name === null) {
          key.key_name = "n/a";
        }
        key.created_at = new Date(key.created_at).toLocaleString();
      });
      setApiKeys(keys || []);
    }
  }, [client]);

  useEffect(() => {
    refreshKeys();
  }, [refreshKeys]);

  return { apiKeys, refreshKeys };
}
