import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import type { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import PromptsPage from "../../components/templates/prompts/promptsPage";
import { NextPageWithLayout } from "../_app";

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
  const { tab } = ctx.query;

  return {
    props: {
      defaultIndex: tab ? parseInt(tab as string) : 0,
    },
  };
};
