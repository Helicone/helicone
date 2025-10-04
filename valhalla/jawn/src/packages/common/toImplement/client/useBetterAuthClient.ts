import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { SSRContext } from "../../auth/client/getSSRHeliconeAuthClient";
export async function betterAuthClientFromSSRContext(
  ctx: SSRContext<any, any, any>,
): Promise<any> {
  throw new Error("useSupabaseAuthClient is not implemented");
}

export function useBetterAuthClient(): HeliconeAuthClient {
  throw new Error("useSupabaseAuthClient is not implemented");
}
