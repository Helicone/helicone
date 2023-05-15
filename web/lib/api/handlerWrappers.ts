// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { Result } from "../result";
import { SupabaseServerWrapper } from "../wrappers/supabase";
import { User } from "@supabase/auth-helpers-nextjs";

export interface HandlerWrapperOptions<RetVal> {
  req: NextApiRequest;
  res: NextApiResponse<RetVal>;
  supabaseClient: SupabaseServerWrapper<RetVal>;
  userData: {
    userId: string;
    orgId: string;
    user: User;
  };
}

export function withAuth<T>(
  handler: (supabaseServer: HandlerWrapperOptions<T>) => Promise<void>
) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<T | { error: string }>
  ) => {
    const supabaseClient = new SupabaseServerWrapper({
      req,
      res,
    });
    const { data, error } = await supabaseClient.getUserAndOrg();
    if (error !== null || !data.orgId || !data.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    await handler({
      req,
      res,
      supabaseClient,
      userData: data,
    });
  };
}

export interface HandlerWrapperOptionsSSR<RetVal> {
  context: GetServerSidePropsContext;
  supabaseClient: SupabaseServerWrapper<RetVal>;
  userData: {
    userId: string;
    orgId: string;
    user: User;
  };
}

export function withAuthSSR<T>(
  getServerSidePropsFunc: (
    options: HandlerWrapperOptionsSSR<T>
  ) => ReturnType<GetServerSideProps>
) {
  return async (
    context: GetServerSidePropsContext
  ): Promise<ReturnType<GetServerSideProps>> => {
    const supabaseClient = new SupabaseServerWrapper(context);
    const { data, error } = await supabaseClient.getUserAndOrg();
    if (error !== null || !data.orgId || !data.userId) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    } else {
      return await getServerSidePropsFunc({
        context,
        supabaseClient,
        userData: data,
      });
    }
  };
}
