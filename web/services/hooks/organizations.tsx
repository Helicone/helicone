import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Members } from "../../pages/api/organization/[id]/members";
import { Owner } from "../../pages/api/organization/[id]/owner";
import { Database } from "../../supabase/database.types";

const useGetOrgMembers = (orgId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["OrganizationsMembers", orgId],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      return fetch(`/api/organization/${organizationId}/members`).then(
        (res) => res.json() as Promise<Members>
      );
    },
    refetchOnWindowFocus: false,
  });
  return {
    data,
    isLoading,
    refetch,
  };
};

const useGetOrgOwner = (orgId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsMembersOwner", orgId],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      return fetch(`/api/organization/${organizationId}/owner`).then(
        (res) => res.json() as Promise<Owner>
      );
    },
    refetchOnWindowFocus: false,
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgs = () => {
  const supabaseClient = useSupabaseClient<Database>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Organizations"],
    queryFn: async (query) => {
      const { data, error } = await supabaseClient
        .from("organization")
        .select(`*`);
      if (error) {
        throw error;
      }
      // if (!data.find((d) => d.is_personal)) {
      //   await supabaseClient.rpc("ensure_personal");
      //   refetch();
      // }
      return data;
    },
    refetchOnWindowFocus: false,
  });
  data && data.sort((a, b) => (a.is_personal ? -1 : 1));
  return {
    data,
    isLoading,
    refetch,
  };
};

export { useGetOrgMembers, useGetOrgOwner, useGetOrgs };
