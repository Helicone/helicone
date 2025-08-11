import { SupabaseServerWrapper } from "@/lib/wrappers/supabase";
import {
  NextApiRequest,
  NextApiResponse,
  GetServerSidePropsContext,
} from "next";
import { SSRContext } from "../../auth/client/getSSRHeliconeAuthClient";
import { SupabaseAuthClient } from "./useSupabaseAuthClient";

export async function supabaseAuthClientFromSSRContext(
  ctx: SSRContext<
    NextApiRequest & { headers: Record<string, string> },
    NextApiResponse,
    GetServerSidePropsContext
  >,
) {
  const supabaseClient = new SupabaseServerWrapper(ctx);
  const user = await supabaseClient.getClient().auth.getUser();

  const userAndOrg = (await supabaseClient.getUserAndOrg()).data;

  return new SupabaseAuthClient(
    supabaseClient.client,
    {
      email: user.data.user?.email ?? "",
      id: user.data.user?.id ?? "",
    },
    userAndOrg && userAndOrg.org
      ? {
          org: userAndOrg.org,
          role: userAndOrg.role,
        }
      : undefined,
  );
}
