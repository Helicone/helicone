import { useMemo } from "react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { authClient, heliconeAuthClientFromSession } from "./betterAuthHelper";
import { useOrg } from "@/components/layout/org/organizationContext";

export function useBetterAuthClient(): HeliconeAuthClient {
  const session = authClient.useSession();

  const orgs = useOrg();
  // Map Better Auth user to HeliconeUserobject is memoized with correct dependencies
  const clientImplementation = useMemo((): HeliconeAuthClient => {
    return heliconeAuthClientFromSession(
      session.data,
      session.refetch,
      orgs?.currentOrg
        ? {
            org: orgs?.currentOrg,
            role: "member",
          }
        : undefined
    );
  }, [session, orgs]);

  return clientImplementation;
}
