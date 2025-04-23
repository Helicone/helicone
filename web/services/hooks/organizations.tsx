import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrgContextValue } from "@/components/layout/org/OrgContextValue";
import useNotification from "@/components/shared/notification/useNotification";
import { getHeliconeCookie } from "@/lib/cookies";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import Cookies from "js-cookie";
import { env } from "next-runtime-env";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { $JAWN_API, getJawnClient } from "../../lib/clients/jawn";
import { ORG_ID_COOKIE_KEY } from "../../lib/constants";

const useGetOrgMembers = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["OrganizationsMembers", orgId],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      if (!organizationId) {
        return [];
      }
      try {
        const { data: orgMembers, error } = await jawn.GET(
          `/v1/organization/{organizationId}/members`,
          {
            params: {
              path: {
                organizationId,
              },
            },
          }
        );

        if (error) {
          console.error("Error fetching org members:", error);
          return [];
        }

        return orgMembers.data || [];
      } catch (error) {
        console.error("Error in useGetOrgMembers:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });
  return {
    data: data || [],
    isLoading,
    refetch,
  };
};

const useGetOrgSlackIntegration = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsSlackIntegration", orgId],
    queryFn: async (query) => {
      const { data, error } = await jawn.GET("/v1/integration/slack/settings");

      if (error) {
        console.error("Error fetching slack integration:", error);
        return null;
      }
      return data;
    },
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgSlackChannels = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsSlackChannels", orgId],
    queryFn: async (query) => {
      const { data, error } = await jawn.GET("/v1/integration/slack/channels");
      if (error) {
        console.error("Error fetching slack channels:", error);
        return null;
      }
      return data.data || [];
    },
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgOwner = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsMembersOwner", orgId],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      const { data: owner, error } = await jawn.GET(
        "/v1/organization/{organizationId}/owner",
        {
          params: {
            path: {
              organizationId: organizationId,
            },
          },
        }
      );

      return owner;
    },
    refetchOnWindowFocus: false,
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgMembersAndOwner = (orgId: string) => {
  const { data: members, isLoading: isMembersLoading } =
    useGetOrgMembers(orgId);
  const { data: owner, isLoading: isOwnerLoading } = useGetOrgOwner(orgId);

  const isLoading = isMembersLoading || isOwnerLoading;

  const data = {
    owner,
    members,
  };

  return {
    data,
    isLoading,
  };
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
    }
  );
};

const useGetOrgs = () => {
  const { data, isPending, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization",
    {
      refetchOnWindowFocus: false,
      refetchInterval: 10_000, // Refetch every 10 seconds
      refetchIntervalInBackground: true,
    }
  );

  data?.data &&
    data.data.sort((a, b) => {
      if (a.name === b.name) {
        return a.id < b.id ? -1 : 1;
      }
      // put demo last
      if (a.tier === "demo") {
        return 1;
      }
      if (b.tier === "demo") {
        return -1;
      }
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });

  return {
    data: data?.data ?? [],
    isPending,
    refetch,
  };
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
      orgProviderKey,
      limits,
      resellerId,
      organizationType,
    }: {
      orgId: string;
      name: string;
      color: string;
      icon: string;
      variant: string;
      orgProviderKey?: string;
      limits?: any;
      resellerId?: string;
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
            ...(variant === "reseller" && {
              org_provider_key: orgProviderKey,
              limits,
              reseller_id: resellerId,
              organization_type: organizationType,
            }),
          },
        }
      );
    },
    onSuccess: () => {
      setNotification("Organization updated", "success");
      queryClient.invalidateQueries({
        queryKey: ["Organizations", user?.id ?? ""],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["OrganizationsId"],
        refetchType: "all",
      });
    },
  });
};

const setOrgCookie = (orgId: string) => {
  Cookies.set(ORG_ID_COOKIE_KEY, orgId, { expires: 30 });
};

const useOrgsContextManager = () => {
  const { user } = useHeliconeAuthClient();
  const { data: orgs, refetch } = useGetOrgs();
  const [org, setOrg] = useState<NonNullable<typeof orgs>[number] | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [isResellerOfCurrentCustomerOrg, setIsResellerOfCurrentOrg] =
    useState<boolean>(false);

  const refreshCurrentOrg = useCallback(() => {
    refetch().then((x) => {
      if (x.data && x.data.data && x.data.data.length > 0) {
        const currentOrg = x.data.data.find(
          (organization) => organization.id === org?.id
        );
        if (currentOrg) {
          setOrg(currentOrg);
          setOrgCookie(currentOrg.id);
          setRenderKey((key) => key + 1);
        }
      }
    });
  }, [refetch]);

  const hasRunRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (user?.id && hasRunRef.current === user.id) {
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    if (user?.id && (!orgs || orgs.length === 0)) {
      setTimeout(() => {
        refetch();
      }, 1500);
      return;
    }

    if (
      user?.id &&
      !isProcessingRef.current &&
      hasRunRef.current !== user.id &&
      orgs &&
      orgs.length > 0
    ) {
      const demoOrg = orgs?.find((org) => org.tier === "demo");

      // If demo org exists and demo data is already set up, mark as complete and exit
      if (
        demoOrg &&
        demoOrg.onboarding_status &&
        typeof demoOrg.onboarding_status === "object" &&
        (demoOrg.onboarding_status as any).demoDataSetup === true
      ) {
        hasRunRef.current = user.id;
        return;
      }

      isProcessingRef.current = true;
      hasRunRef.current = user.id;
      const jwtToken = getHeliconeCookie().data?.jwtToken;
      const mainOrg = orgs?.find(
        (org) => org.is_main_org === true && org.tier !== "demo"
      );

      if (
        demoOrg &&
        demoOrg.onboarding_status &&
        typeof demoOrg.onboarding_status === "object" &&
        (demoOrg.onboarding_status as any).demoDataSetup === false
      ) {
        fetch(
          `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/organization/setup-demo`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "helicone-authorization": JSON.stringify({
                _type: "jwt",
                token: jwtToken,
                orgId: demoOrg.id,
              }),
            },
          }
        );
      }

      const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
      const orgFromCookie = orgs?.find((org) => org.id === orgIdFromCookie);

      if (!orgFromCookie && mainOrg) {
        setOrgCookie(mainOrg.id);
      }

      refreshCurrentOrg();

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 0);
    }
  }, [orgs, user?.id]);

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        name: user.user_metadata?.name,
        email: user.email,
      });
    }

    if (org) {
      posthog.group("organization", org.id, {
        name: org.name || "",
        tier: org.tier || "",
        stripe_customer_id: org.stripe_customer_id || "",
        organization_type: org.organization_type || "",
        date_joined: org.created_at || "",
        has_onboarded: org.has_onboarded || false,
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
  }, [user, org?.id, org?.name, org?.tier]);

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
      const orgFromCookie = orgs.find((org) => org.id === orgIdFromCookie);
      if (!orgFromCookie) {
        Cookies.set(ORG_ID_COOKIE_KEY, orgs[0].id, { expires: 30 });
      }
      if (orgFromCookie?.tier === "demo") {
        return;
      }
      setOrg(orgFromCookie || orgs[0]);
    }
  }, [orgs]);

  useEffect(() => {
    setIsResellerOfCurrentOrg(
      !!(
        org?.organization_type === "customer" &&
        org.reseller_id &&
        orgs?.find((x) => x.id === org.reseller_id)
      )
    );
  }, [org?.organization_type, org?.reseller_id, orgs]);

  let orgContextValue: OrgContextValue | null = null;

  orgContextValue = {
    allOrgs: orgs ?? [],
    currentOrg: org ?? undefined,
    isResellerOfCurrentCustomerOrg,
    refreshCurrentOrg,
    setCurrentOrg: (orgId) => {
      refetch().then((data) => {
        const org = data.data?.data?.find((org) => org.id === orgId);
        if (org) {
          setOrg(org);
          setOrgCookie(org.id);
          setRenderKey((key) => key + 1);
        }
      });
    },
    renderKey,
    refetchOrgs: refetch,
  };

  return orgContextValue;
};

export {
  setOrgCookie,
  useGetOrg,
  useGetOrgMembers,
  useGetOrgMembersAndOwner,
  useGetOrgOwner,
  useGetOrgs,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
  useOrgsContextManager,
};
