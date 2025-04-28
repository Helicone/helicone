import { OrgContextValue } from "@/components/layout/org/OrgContextValue";
import { Database } from "@/db/database.types";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { HeliconeUser } from "@/packages/common/auth/types";
import Cookies from "js-cookie";
import { env } from "next-runtime-env";
import posthog from "posthog-js";
import { useEffect, useMemo } from "react";
import { $JAWN_API, $JAWN_API_WITH_ORG } from "../../lib/clients/jawn";
import { ORG_ID_COOKIE_KEY } from "../../lib/constants";

export const identifyUserOrg = (
  org: Database["public"]["Tables"]["organization"]["Row"],
  user: HeliconeUser
) => {
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
};

const setOrgCookie = (orgId: string) => {
  Cookies.set(ORG_ID_COOKIE_KEY, orgId, { expires: 30 });
};

const useOrgsContextManager = (): OrgContextValue => {
  const { user } = useHeliconeAuthClient();
  const { data: orgs, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization",
    {
      refetchOnWindowFocus: true,
      refetchInterval: 2_000, // Refetch every 2 seconds
      refetchIntervalInBackground: false,
    },
    {
      select: (data) => {
        return data.data?.sort((a, b) => {
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
      },
    }
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
    }
  );
  const org = useMemo(() => {
    if (orgs && orgs.length > 0) {
      const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
      const org = orgs?.find((org) => org.id === orgIdFromCookie) || orgs?.[0];
      setOrgCookie(org.id);
      return org;
    } else {
      setTimeout(() => {
        refetch();
      }, 1000);
    }
    return undefined;
  }, [orgs, refetch]);
  useEffect(() => {
    if (user && org) {
      identifyUserOrg(org, user);
    }
  }, [user, org]);
  useEffect(() => {
    if (orgs && orgs.length > 0 && !org) {
      const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
      const orgFromCookie = orgs.find((org) => org.id === orgIdFromCookie);
      const orgToUse =
        orgFromCookie || orgs.find((org) => org.tier !== "demo") || orgs[0];
      if (orgToUse?.tier === "demo") {
        return;
      }
      if (!orgFromCookie) {
        Cookies.set(ORG_ID_COOKIE_KEY, orgs[0].id, { expires: 30 });
      }
      setOrgCookie(orgToUse.id);
    }
  }, [org, orgs]);
  return {
    allOrgs: orgs ?? [],
    currentOrg: org ?? undefined,
    isResellerOfCurrentCustomerOrg: !!(
      org?.organization_type === "customer" &&
      org.reseller_id &&
      orgs?.find((x) => x.id === org.reseller_id)
    ),
    setCurrentOrg: (orgId) => {
      setOrgCookie(orgId);
      refetch();
    },
    refetchOrgs: refetch,
  };
};

export { useOrgsContextManager };
