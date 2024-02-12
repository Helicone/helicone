import type { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import DeveloperPage from "../components/templates/developer/developerPage";
import AuthLayout from "../components/layout/authLayout";

const Developer: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return <DeveloperPage defaultIndex={props.defaultIndex} />;
};

Developer.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Developer;

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
