import { getEnv } from "../../toImplement/helpers/getEnv";
import { supabaseAuthClientFromSSRContext } from "../../toImplement/client/useSupabaseAuthClient";
import { betterAuthClientFromSSRContext } from "../../toImplement/client/useBetterAuthClient";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

export async function getSSRHeliconeAuthClient({
  ctx,
}: {
  ctx: SSRContext<any, any, any>;
}): Promise<HeliconeAuthClient> {
  if (getEnv("NEXT_PUBLIC_BETTER_AUTH") === "true") {
    return betterAuthClientFromSSRContext(ctx);
  }
  return supabaseAuthClientFromSSRContext(ctx);
}

export type SSRContext<
  NextApiRequest extends { headers: Record<string, string> },
  NextApiResponse,
  GetServerSidePropsContext,
> = { req: NextApiRequest; res: NextApiResponse } | GetServerSidePropsContext;
