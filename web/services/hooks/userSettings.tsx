import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";

const useUserSettings = (userId: string) => {
  const client = useSupabaseClient();
  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ["userSettings", userId],
    queryFn: async (query) => {
      const userId = query.queryKey[1] as string;
      const { data, error } = await client
        .from("user_settings")
        .select("*")
        .eq("user", userId)
        .single();

      if (error) {
        return { data: null, error: error };
      }
      return { data: data, error: null };
    },
  });

  return {
    userSettings: data
      ? (data?.data as Database["public"]["Tables"]["user_settings"]["Row"])
      : null,
    isLoading,
    error,
    refetch,
  };
};

export { useUserSettings };
