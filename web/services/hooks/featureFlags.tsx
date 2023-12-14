import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";

/**
 * Custom hook to fetch and manage feature flags.
 * @param featureFlag - The feature flag to fetch.
 * @param orgId - The organization ID.
 * @returns An object containing the flag status, loading state, refetch function, and data.
 */
const useFeatureFlags = (featureFlag: string, orgId: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["featureFlags", featureFlag, orgId],
    queryFn: async (query) => {
      const currentFeatureFlag = query.queryKey[1];
      const currentOrgId = query.queryKey[2];
      if (!currentOrgId || !currentFeatureFlag) return null;
      const resp = await supabaseClient
        .from("feature_flags")
        .select("*", { count: "exact" })
        .eq("feature", currentFeatureFlag)
        .eq("org_id", currentOrgId);

      return resp;
    },
    refetchOnWindowFocus: false,
    staleTime: oneDayInMilliseconds,
  });

  const hasFlag = data?.count ? data.data && data?.count > 0 : false;

  return { hasFlag: hasFlag, isLoading, refetch, data: data ?? null };
};

export { useFeatureFlags };
