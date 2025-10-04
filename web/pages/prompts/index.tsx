import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import type { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import OldPromptsPage from "../../components/templates/prompts/promptsPage";
import NewPromptsPage from "../../components/templates/prompts2025/promptsPage";
import { NextPageWithLayout } from "../_app";
import { useHasPrompts } from "../../services/hooks/prompts/prompts";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useRouter } from "next/router";

const Prompts: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  const { isLoading } = useHasPrompts();
  const router = useRouter();
  const forceOldVersion = router.query.legacy === "true";

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return forceOldVersion ? (
    <OldPromptsPage defaultIndex={props.defaultIndex} />
  ) : (
    <NewPromptsPage defaultIndex={props.defaultIndex} />
  );
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
