import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { getUSDate } from "../../components/shared/utils/utils";
import { Database } from "../../supabase/database.types";

export const useHeliconeKeys = () => {
  const client = useSupabaseClient<Database>();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["helicone-keys"],
    queryFn: async () => {
      return await client.from("helicone_api_keys").select("*");
    },
    refetchOnWindowFocus: false,
  });

  if (data?.data) {
    data.data.forEach((key) => {
      if (key.api_key_name === null) {
        key.api_key_name = "n/a";
      }
      key.created_at = getUSDate(new Date(key.created_at).toLocaleString());
    });
  }

  return {
    keys: data,
    isLoading: isLoading || isRefetching,
    refetch,
    error,
  };
};
