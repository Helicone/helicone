import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";
import { useOrg } from "../../components/layout/organizationContext";

export const useHeliconeKeys = () => {
  const client = useSupabaseClient<Database>();
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["helicone-keys", org?.currentOrg?.id],
    queryFn: async () => {
      return await client
        .from("helicone_api_keys")
        .select("*")
        .eq("soft_delete", false)
        .neq("api_key_name", "auto-generated-experiment-key")
        .eq("organization_id", org?.currentOrg?.id ?? "");
    },
    refetchOnWindowFocus: false,
  });

  if (data?.data) {
    data.data.forEach((key) => {
      if (key.api_key_name === null) {
        key.api_key_name = "n/a";
      }
    });
  }

  return {
    keys: data,
    isLoading: isLoading || isRefetching,
    refetch,
    error,
  };
};
