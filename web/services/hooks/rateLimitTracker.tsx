import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { HeliconeRequest } from "../../lib/shared/request/request";
import { Result } from "../../lib/shared/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { useOrg } from "../../components/shared/layout/organizationContext";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "../../supabase/database.types";

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
    isLoading,
  };
};

export { useRateLimitTracker };
