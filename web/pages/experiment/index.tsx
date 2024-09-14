import ExperimentTablePage from "@/components/templates/prompts/experiments/experimentTablePage";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import type { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { NextPageWithLayout } from "../_app";

const Prompts: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return <ExperimentTablePage defaultIndex={props.defaultIndex} />;
};

Prompts.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Prompts;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const { tab } = ctx.query;

  return {
    props: {
      initialSession: session,
      user: session.user,
      defaultIndex: tab ? parseInt(tab as string) : 0,
    },
  };
};
