import type { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import UserIdPage from "../../components/templates/users/id/userIdPage";
import AuthLayout from "../../components/layout/auth/authLayout";

const UserId: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  const { userId, defaultIndex } = props;
  const decodedUserId = decodeURIComponent(userId);
  return <UserIdPage userId={decodedUserId} defaultIndex={defaultIndex} />;
};

UserId.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default UserId;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { tab } = ctx.query;

  return {
    props: {
      userId: (ctx.params?.id as string) || "",
      defaultIndex: tab ? parseInt(tab as string) : 0,
    },
  };
};
