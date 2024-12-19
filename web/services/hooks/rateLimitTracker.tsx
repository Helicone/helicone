import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "../../supabase/database.types";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";

export interface RateLimitPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  timeZoneDifference: number;
  dbIncrement: TimeIncrement | undefined;
}

const useRateLimitTracker = () => {
  const org = useOrg();
  const client = useSupabaseClient<Database>();

  const { data, isLoading } = useQuery({
    queryKey: ["rateLimitTracker", org?.currentOrg?.id],
    queryFn: async (query) => {
      client;
      const orgId = query.queryKey[1] as string;
      const rateLimit = await client
        .from("org_rate_limit_tracker")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return rateLimit;
    },
  });
  return {
    request: data?.data,
    isLoading: isLoading,
  };
};

export { useRateLimitTracker };
