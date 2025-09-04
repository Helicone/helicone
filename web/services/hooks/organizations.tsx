import { OrgContextValue } from "@/components/layout/org/OrgContextValue";
import useNotification from "@/components/shared/notification/useNotification";
import { Database } from "@/db/database.types";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { HeliconeUser } from "@/packages/common/auth/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { env } from "next-runtime-env";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import {
  $JAWN_API,
  $JAWN_API_WITH_ORG,
  getJawnClient,
} from "../../lib/clients/jawn";
import type { paths } from "../../lib/clients/jawnTypes/private";
import { ORG_ID_COOKIE_KEY } from "../../lib/constants";
import { OnboardingState } from "./useOrgOnboarding";

const useGetOrgMembers = (orgId: string) => {
  const { data, isLoading, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization/{organizationId}/members",
    {
      params: {
        path: {
          organizationId: orgId,
        },
      },
    },
    {
      refetchOnWindowFocus: false,
    },
  );
  return {
    data: data?.data || [],
    isLoading,
    refetch,
  };
};

const useGetOrgSlackIntegration = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/integration/slack/settings",
    {},
    {
      refetchOnWindowFocus: false,
    },
  );
};

const useGetOrgSlackChannels = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/integration/slack/channels",
    {},
    {
      refetchOnWindowFocus: false,
    },
  );
};

const useGetOrgOwner = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/organization/{organizationId}/owner",
    {
      params: { path: { organizationId: orgId } },
    },
    {
      refetchOnWindowFocus: false,
    },
  );
};

const useGetOrg = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    `/v1/organization/{organizationId}`,
    {
      params: { path: { organizationId: orgId } },
    },
    {
      refetchOnWindowFocus: false,
      retry: true,
    },
  );
};

const useGetOrgs = () => {
  const { data, isPending, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization",
    {},
    {
      refetchOnWindowFocus: false,
      refetchInterval: 10_000,
      refetchIntervalInBackground: true,
      retry: (failureCount, error) => {
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      select: (response) => {
        if (
          response?.data &&
          Array.isArray(response.data) &&
          response.data.length === 0
        ) {
          throw new Error("Organization list is empty, retrying...");
        }
        response.data?.sort((a, b) => {
          if (a.name === b.name) {
            return a.id < b.id ? -1 : 1;
          }
          return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        });
        return response;
      },
    },
  );

  return {
    data: data?.data ?? [],
    isPending,
    refetch,
  };
};

const identifyUserOrg = (
  org: Database["public"]["Tables"]["organization"]["Row"],
  user: HeliconeUser,
) => {
  if (user) {
    posthog.identify(user.id, {
      name: user.user_metadata?.name,
      email: user.email,
    });
  }

  const orgOnboardingStatus = org.onboarding_status as unknown as OnboardingState;

  if (org) {
    posthog.group("organization", org.id, {
      name: org.name || "",
      tier: org.tier || "",
      stripe_customer_id: org.stripe_customer_id || "",
      organization_type: org.organization_type || "",
      date_joined: org.created_at || "",
      has_onboarded: org.has_onboarded || false,
      has_integrated: orgOnboardingStatus?.hasIntegrated || false,
      has_completed_quickstart: orgOnboardingStatus?.hasCompletedQuickstart || false,
    });

    if (user && env("NEXT_PUBLIC_IS_ON_PREM") !== "true") {
      window.pylon = {
        chat_settings: {
          app_id: "f766dfd3-28f8-40a8-872f-351274cbd306",
          email: user.email,
          name: user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
        },
      };

      if (window.Pylon) {
        window.Pylon("setNewIssueCustomFields", {
          organization_id: org.id,
          organization_name: org.name,
          organization_tier: org.tier,
        });
      }
    }
  }
};

const useAddOrgMemberMutation = () => {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  
  return $JAWN_API.useMutation("post", "/v1/organization/{organizationId}/add_member", {
    onSuccess: (_data, variables) => {
      setNotification("Member added successfully", "success");
      
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/organization/{organizationId}/members", { params: { path: { organizationId: variables.params.path.organizationId } } }],
      });
      
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("/v1/organization") ||
            queryKey.includes("organization") ||
            queryKey.includes("Organizations")
          );
        },
        refetchType: "all",
      });
    },
    onError: (error) => {
      setNotification("Failed to add member", "error");
    },
  });
};

export const useUpdateOrgMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useHeliconeAuthClient();
  const { setNotification } = useNotification();
  return useMutation({
    mutationFn: async ({
      orgId,
      name,
      color,
      icon,
      variant,
    }: {
      orgId: string;
      name: string;
      color: string;
      icon: string;
      variant: string;
      orgProviderKey?: string;
      limits?: any;
      organizationType?: string;
    }) => {
      const jawn = getJawnClient(orgId);
      const { data, error } = await jawn.POST(
        "/v1/organization/{organizationId}/update",
        {
          params: { path: { organizationId: orgId } },
          body: {
            name,
            color,
            icon,
            variant,
          },
        },
      );
    },
    onSuccess: () => {
      setNotification("Organization updated", "success");
      // Invalidate queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("/v1/organization") ||
            queryKey.includes("organization") ||
            queryKey.includes("Organizations")
          );
        },
        refetchType: "all",
      });
    },
  });
};

const setOrgCookie = (orgId: string) => {
  Cookies.set(ORG_ID_COOKIE_KEY, orgId, { expires: 30 });
};

const useOrgsContextManager = (): OrgContextValue => {
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    undefined,
  );
  const { user } = useHeliconeAuthClient();
  const { data: orgs, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization",
    {},
    {
      enabled: !!user?.id,
      refetchOnWindowFocus: true,
      refetchInterval: (selectedOrgsData) => {
        if (!user?.id) {
          return 1_000;
        }
        if (
          !selectedOrgsData.state.data?.data ||
          selectedOrgsData.state.data?.data?.length === 0
        ) {
          return 1_000;
        }
        // semantics are a little confusing here, but we distinguish
        // onboarding (initial welcome), integration (first request), quickstart (steps)
        const hasNotCompletedFullOnboarding = selectedOrgsData.state.data?.data?.some((org) => !org.onboarding_status?.hasCompletedQuickstart);
        if (hasNotCompletedFullOnboarding) {
          return 5_000;
        }
        return false;
      },
      refetchIntervalInBackground: false,
      select: (data) => {
        return data.data?.sort((a, b) => {
          if (a.name === b.name) {
            return a.id < b.id ? -1 : 1;
          }
          if (a.tier === "demo") {
            return 1;
          }
          if (b.tier === "demo") {
            return -1;
          }
          return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        });
      },
    },
  );

  const demoOrg = orgs?.find((org) => org.tier === "demo");
  $JAWN_API_WITH_ORG(demoOrg?.id).useQuery(
    "post",
    "/v1/organization/setup-demo",
    {},
    {
      enabled:
        ((demoOrg?.has_onboarded as any)?.demoDataSetup ?? false) === false,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );
  const org = useMemo(() => {
    if (orgs && orgs.length > 0) {
      const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
      const org =
        orgs?.find((org) => org.id === (selectedOrgId || orgIdFromCookie)) ||
        orgs?.[0];
      setOrgCookie(org.id);
      return org;
    }
    return undefined;
  }, [orgs, selectedOrgId]);

  useEffect(() => {
    if (user && org) {
      identifyUserOrg(org, user);
    }
  }, [user, org]);

  return {
    allOrgs: orgs ?? [],
    currentOrg: org ?? undefined,
    setCurrentOrg: (orgId) => {
      setSelectedOrgId(orgId);
      refetch();
    },
    refetchOrgs: refetch,
  };
};

export {
  setOrgCookie,
  useAddOrgMemberMutation,
  useGetOrg,
  useGetOrgMembers,
  useGetOrgOwner,
  useGetOrgs,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
  useOrgsContextManager,
};
