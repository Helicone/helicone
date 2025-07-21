import { useMemo } from "react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { authClient, heliconeAuthClientFromSession } from "./betterAuthHelper";

export function useBetterAuthClient(): HeliconeAuthClient {
  const session = authClient.useSession();
  return useMemo(() => {
    return heliconeAuthClientFromSession(
      session.data as any,
      session.refetch,
      undefined,
    );
  }, [session]);
}
