import { SSRContext } from "../../auth/client/getSSRHeliconeAuthClient";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";

export async function supabaseAuthClientFromSSRContext(
  ctx: SSRContext<any, any, any>,
): Promise<any> {
  throw new Error("useSupabaseAuthClient is not implemented");
}

export function useSupabaseAuthClient(): HeliconeAuthClient {
  throw new Error("useSupabaseAuthClient is not implemented");
}
