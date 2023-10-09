import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { getUSDateFromString } from "../../components/shared/utils/utils";
import { Database } from "../../supabase/database.types";
import { useOrg } from "../../components/shared/layout/organizationContext";

export const useHeliconeKeys = () => {
  const client = useSupabaseClient<Database>();
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["helicone-keys", org?.currentOrg.id],
    queryFn: async () => {
      return await client
        .from("helicone_api_keys")
        .select("*")
        .eq("soft_delete", false)
        .eq("organization_id", org?.currentOrg.id);
    },
    refetchOnWindowFocus: false,
  });

  if (data?.data) {
    data.data.forEach((key) => {
      if (key.api_key_name === null) {
        key.api_key_name = "n/a";
      }
      key.created_at = getUSDateFromString(
        new Date(key.created_at).toLocaleString()
      );
    });
  }

  return {
    keys: data,
    isLoading: isLoading || isRefetching,
    refetch,
    error,
  };
};
