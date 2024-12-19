import { useQuery } from "@tanstack/react-query";
import { Database } from "../../../../supabase/database.types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOrg } from "../../../../components/layout/org/organizationContext";

const usePortalPage = () => {
  const supabase = useSupabaseClient();
  const org = useOrg();

  const { data, isLoading, refetch } = useQuery<
    Database["public"]["Tables"]["organization"]["Row"][]
  >(["orgs", org?.currentOrg?.id], async (query) => {
    const orgId = query.queryKey[1];

    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("soft_delete", false)
      .eq("reseller_id", orgId);

    if (error) {
      return [];
    }

    return data as Database["public"]["Tables"]["organization"]["Row"][];
  });

  return { data, isLoading, refetch };
};

export default usePortalPage;
