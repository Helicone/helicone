import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";

const useFeatureFlags = (orgId: string, featureFlag: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["featureFlags", orgId, featureFlag],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      const currentFeatureFlag = query.queryKey[2];
      const resp = await supabaseClient
        .from("feature_flags")
        .select("*", { count: "exact", head: true })
        .eq("org_id", organizationId)
        .eq("feature", currentFeatureFlag);

      return resp;
    },
    refetchOnWindowFocus: false,
    staleTime: oneDayInMilliseconds,
  });

  const hasFlag = data?.count ? data?.count > 0 : false;

  return { hasFlag: hasFlag, isLoading, refetch };
};

export { useFeatureFlags };
