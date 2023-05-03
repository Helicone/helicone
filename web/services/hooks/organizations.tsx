import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Members } from "../../pages/api/organization/[id]/members";
import { Owner } from "../../pages/api/organization/[id]/owner";
import { Database } from "../../supabase/database.types";
import { useEffect, useState } from "react";
import { OrgContextValue } from "../../components/shared/layout/organizationContext";

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
  const user = useUser();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Organizations", user?.id ?? ""],
    queryFn: async (query) => {
      if (!user?.id) {
        return [];
      }
      const { data, error } = await supabaseClient
        .from("organization")
        .select(`*`);
      if (error) {
        return [];
      }
      if (!data.find((d) => d.is_personal)) {
        await supabaseClient.rpc("ensure_personal");
        console.warn("Created personal org");
        // just a shim that will only execute once for the entire life time of a user
        return (await supabaseClient.from("organization").select(`*`)).data!;
      }
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

const useOrgsContextManager = () => {
  const { data: orgs } = useGetOrgs();

  const [org, setOrg] = useState<NonNullable<typeof orgs>[number] | null>(null);

  useEffect(() => {
    if (orgs) {
      setOrg(orgs[0]);
    }
  }, [orgs]);
  let orgContextValue: OrgContextValue | null = null;
  if (org && orgs) {
    orgContextValue = {
      allOrgs: orgs,
      currentOrg: org,
      setCurrentOrg: (orgId) => {
        const org = orgs?.find((org) => org.id === orgId);
        if (org) {
          setOrg(org);
        }
      },
    };
  }
  return orgContextValue;
};

export { useGetOrgMembers, useGetOrgOwner, useGetOrgs, useOrgsContextManager };
