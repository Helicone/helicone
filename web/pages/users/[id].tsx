import type { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import UserIdPage from "../../components/templates/users/id/userIdPage";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

const UserId: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  const { userId, defaultIndex } = props;
  // need to decode the userId
  const decodedUserId = decodeURIComponent(userId);
  return <UserIdPage userId={decodedUserId} defaultIndex={defaultIndex} />;
};

UserId.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default UserId;

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
      userId: (ctx.params?.id as string) || "",
      defaultIndex: tab ? parseInt(tab as string) : 0,
    },
  };
};
