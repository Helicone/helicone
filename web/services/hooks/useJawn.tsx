import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";
import { useOrg } from "../../components/layout/organizationContext";
import { getHeliconeCookie } from "../../lib/cookies";

export const useJawn = () => {
  const org = useOrg();
  const authFromCookie = getHeliconeCookie();

  const posthog = usePostHog();

  const fetchJawn = useCallback(
    async ({
      path,
      body,
      method,
    }: {
      path: string;
      body?: string;
      method: string;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}${path}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            "helicone-authorization": JSON.stringify({
              _type: "jwt",
              token: authFromCookie.data?.jwtToken,
              orgId: org?.currentOrg?.id,
            }),
          },
          body: body,
        }
      );

      if (!res.ok) {
        posthog.capture("jawn_request_failed", {
          path,
          method,
          status: res.status,
        });
      }

      return res;
    },
    [authFromCookie.data?.jwtToken, org?.currentOrg?.id, posthog]
  );
  return {
    fetchJawn,
  };
};
