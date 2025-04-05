import {
  supabaseAuthClientFromSSRContext,
  useSupabaseAuthClient,
} from "../../toImplement/client/useSupabaseAuthClient";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

/**
 * Use the auth client in a React component
 * @returns The auth client
 */
export function useHeliconeAuthClient(): HeliconeAuthClient {
  return useSupabaseAuthClient();
}

export type SSRContext<
  NextApiRequest,
  NextApiResponse,
  GetServerSidePropsContext
> = { req: NextApiRequest; res: NextApiResponse } | GetServerSidePropsContext;

export async function getSSRHeliconeAuthClient({
  ctx,
}: {
  ctx: SSRContext<any, any, any>;
}): Promise<HeliconeAuthClient> {
  return supabaseAuthClientFromSSRContext(ctx);
}
