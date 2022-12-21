import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Database } from "../supabase/database.types";

export function useKeys(supabaseClient: SupabaseClient) {
  const [apiKeys, setApiKeys] = useState<
    Database["public"]["Tables"]["user_api_keys"]["Row"][]
  >([]);

  useEffect(() => {
    function getKeys() {
      supabaseClient
        .from("user_api_keys")
        .select("*")
        .then((res) => {
          if (res.error) {
            console.log(res.error);
          } else {
            setApiKeys(res.data);
          }
        });
    }
    getKeys();
    supabaseClient
      .channel("user_api_keys_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_api_keys" },
        () => {
          getKeys();
        }
      )
      .subscribe(async (status) => {
        console.log("STATUS", status);
      });
  }, [supabaseClient]);
  return apiKeys;
}
