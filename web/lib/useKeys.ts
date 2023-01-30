import { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { Database } from "../supabase/database.types";

export function useKeys(supabaseClient: SupabaseClient) {
  const [apiKeys, setApiKeys] =
    useState<Database["public"]["Tables"]["user_api_keys"]["Row"][]>();

  const getKeys = useCallback(async () => {
    supabaseClient
      .from("user_api_keys")
      .select("*")
      .then((res) => {
        if (res.error) {
          console.log(res.error);
        } else {
          const keys = res.data;
          keys.forEach((key) => {
            key.created_at = new Date(key.created_at).toLocaleString();
          });
          setApiKeys(keys);
        }
      });
  }, [supabaseClient]);

  useEffect(() => {
    getKeys();
  }, [getKeys]);

  return { apiKeys, getKeys };
}
