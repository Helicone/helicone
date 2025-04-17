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
    }
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
    }
  );
};

const useGetOrgSlackChannels = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/integration/slack/channels",
    {},
    {
      refetchOnWindowFocus: false,
    }
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
    }
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
    }
  );
};

const useGetOrgs = () => {
  const { data, isPending, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization",
    {},
    {
      refetchOnWindowFocus: false,
      // refetchInterval: 10_000, // <-- Temporarily comment out
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
        return response;
      },
    }
  );

  const organizations = data?.data ?? [];

  organizations.sort((a, b) => {
    if (a.name === b.name) {
      return a.id < b.id ? -1 : 1;
    }
    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
  });

  return {
    data: organizations,
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

  const hasRunRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  // useEffect(() => {
  //   if (user?.id && hasRunRef.current === user.id) {
  //     return;
  //   }

  //   if (isProcessingRef.current) {
  //     return;
  //   }

  //   if (user?.id && (!orgs || orgs.length === 0)) {
  //     setTimeout(() => {
  //       refetch();
  //     }, 1500);
  //     return;
  //   }

  //   if (
  //     user?.id &&
  //     !isProcessingRef.current &&
  //     hasRunRef.current !== user.id &&
  //     orgs &&
  //     orgs.length > 0
  //   ) {
  //     const demoOrg = orgs?.find((org) => org.tier === "demo");

  //     if (
  //       demoOrg &&
  //       demoOrg.onboarding_status &&
  //       typeof demoOrg.onboarding_status === "object" &&
  //       (demoOrg.onboarding_status as any).demoDataSetup === true
  //     ) {
  //       hasRunRef.current = user.id;
  //       return;
  //     }

  //     isProcessingRef.current = true;
  //     hasRunRef.current = user.id;
  //     const jwtToken = getHeliconeCookie().data?.jwtToken;
  //     const mainOrg = orgs?.find((org) => org.is_main_org === true);

  //     if (
  //       demoOrg &&
  //       demoOrg.onboarding_status &&
  //       typeof demoOrg.onboarding_status === "object" &&
  //       (demoOrg.onboarding_status as any).demoDataSetup === false
  //     ) {
  //       fetch(
  //         `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/organization/setup-demo`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //             "helicone-authorization": JSON.stringify({
  //               _type: "jwt",
  //               token: jwtToken,
  //               orgId: demoOrg.id,
  //             }),
  //           },
  //         }
  //       );
  //     }

  //     const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
  //     const orgFromCookie = orgs?.find((org) => org.id === orgIdFromCookie);

  //     if (!orgFromCookie && mainOrg) {
  //       setOrgCookie(mainOrg.id);
  //     }

  //     setTimeout(() => {
  //       isProcessingRef.current = false;
  //     }, 0);
  //   }
  // }, [orgs, user?.id]);

  // useEffect(() => {
  //   if (user) {
  //     posthog.identify(user.id, {
  //       name: user.user_metadata?.name,
  //       email: user.email,
  //     });
  //   }

  //   if (org) {
  //     posthog.group("organization", org.id, {
  //       name: org.name || "",
  //       tier: org.tier || "",
  //       stripe_customer_id: org.stripe_customer_id || "",
  //       organization_type: org.organization_type || "",
  //       date_joined: org.created_at || "",
  //       has_onboarded: org.has_onboarded || false,
  //     });

  //     if (user && env("NEXT_PUBLIC_IS_ON_PREM") !== "true") {
  //       window.pylon = {
  //         chat_settings: {
  //           app_id: "f766dfd3-28f8-40a8-872f-351274cbd306",
  //           email: user.email,
  //           name: user.user_metadata?.name,
  //           avatar_url: user.user_metadata?.avatar_url,
  //         },
  //       };

  //       if (window.Pylon) {
  //         window.Pylon("setNewIssueCustomFields", {
  //           organization_id: org.id,
  //           organization_name: org.name,
  //           organization_tier: org.tier,
  //         });
  //       }
  //     }
  //   }
  // }, [user, org?.id, org?.name, org?.tier]);

  // useEffect(() => {
  //   if (orgs && orgs.length > 0) {
  //     const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
  //     const orgFromCookie = orgs.find((org) => org.id === orgIdFromCookie);
  //     if (!orgFromCookie) {
  //       Cookies.set(ORG_ID_COOKIE_KEY, orgs[0].id, { expires: 30 });
  //     }
  //     setOrg(orgFromCookie || orgs[0]);
  //   }
  // }, [orgs]);

  // useEffect(() => {
  //   setIsResellerOfCurrentOrg(
  //     !!(
  //       org?.organization_type === "customer" &&
  //       org.reseller_id &&
  //       orgs?.find((x) => x.id === org.reseller_id)
  //     )
  //   );
  // }, [org?.organization_type, org?.reseller_id, orgs]);

  let orgContextValue: OrgContextValue | null = null;

  orgContextValue = {
    allOrgs: orgs ?? [],
    currentOrg: org ?? undefined,
    isResellerOfCurrentCustomerOrg,

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
  useGetOrgOwner,
  useGetOrgs,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
  useOrgsContextManager,
};
