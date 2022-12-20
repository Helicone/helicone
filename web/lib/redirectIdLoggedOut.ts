import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
  PreviewData,
} from "next";
import { ParsedUrlQuery } from "querystring";

type SSRContext =
  | GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
  | { req: NextApiRequest; res: NextApiResponse<any> };

export function redirectIfLoggedOut(
  destination: string,
  getServerSideProps: (ctx: SSRContext) => Promise<any>
): (ctx: SSRContext) => any {
  return async (ctx: SSRContext) => {
    const supabase = createServerSupabaseClient(ctx);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return {
        redirect: {
          destination,
          permanent: false,
        },
      };
    }
    return await getServerSideProps(ctx);
  };
}
