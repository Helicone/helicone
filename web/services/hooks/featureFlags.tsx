import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";
import { useOrg } from "../../components/shared/layout/organizationContext";

const useFeatureFlags = (featureFlag: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const org = useOrg();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["featureFlags", featureFlag, org?.currentOrg.id],
    queryFn: async (query) => {
      const currentFeatureFlag = query.queryKey[1];
      const currentOrgId = query.queryKey[2];
      if (!currentOrgId || !currentFeatureFlag) return;
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

  return { hasFlag: hasFlag, isLoading, refetch, data };
};

export { useFeatureFlags };
