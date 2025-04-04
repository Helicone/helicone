// import { NextApiRequest } from "next";
// import { GetServerSidePropsContext } from "next";
// import { NextApiResponse } from "next";
import {
  SupabaseAuthClient,
  useSupabaseAuthClient,
} from "../../toImplement/client/useSupabaseAuthClient";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

// import { SupabaseServerWrapper } from "@/lib/wrappers/supabase";

/**
 * Use the auth client in a React component
 * @returns The auth client
 */
export function useHeliconeAuthClient(): HeliconeAuthClient {
  return useSupabaseAuthClient();
}

// export type SSRContext<T> =
//   | { req: NextApiRequest; res: NextApiResponse<T> }
//   | GetServerSidePropsContext;

// export async function getSSRHeliconeAuthClient<T>({
//   ctx,
// }: {
//   ctx: SSRContext<T>;
// }): Promise<HeliconeAuthClient> {
//   const supabaseServer = new SupabaseServerWrapper(ctx);
//   const user = await supabaseServer.getClient().auth.getUser();
//   return new SupabaseAuthClient(supabaseServer.client, {
//     email: user.data.user?.email ?? "",
//     id: user.data.user?.id ?? "",
//   });
// }
