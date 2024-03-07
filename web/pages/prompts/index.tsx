import type { ReactElement } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import PromptsPage from "../../components/templates/prompts/promptsPage";
import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

const Prompts: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return <PromptsPage defaultIndex={props.defaultIndex} />;
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
