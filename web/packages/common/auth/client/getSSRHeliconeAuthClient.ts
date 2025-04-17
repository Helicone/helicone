import { env } from "next-runtime-env";
import { supabaseAuthClientFromSSRContext } from "../../toImplement/client/useSupabaseAuthClient";
import { betterAuthClientFromSSRContext } from "../../toImplement/server/useBetterAuthClient";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

export async function getSSRHeliconeAuthClient({
  ctx,
}: {
  ctx: SSRContext<any, any, any>;
}): Promise<HeliconeAuthClient> {
  if (env("NEXT_PUBLIC_BETTER_AUTH") === "true") {
    return betterAuthClientFromSSRContext(ctx);
  }
  return supabaseAuthClientFromSSRContext(ctx);
}
export type SSRContext<
  NextApiRequest extends { headers: Record<string, string> },
  NextApiResponse,
  GetServerSidePropsContext
> = { req: NextApiRequest; res: NextApiResponse } | GetServerSidePropsContext;
